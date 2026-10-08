'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {formatDateTime} from '@/locale/formatters';
import {Button} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {
  FULFILMENT_STATUS,
  GATEWAY,
  PAYMENT_STATUS,
} from '@/payment/domain/types';
import type {PaymentView} from '@/payment/view';
import {
  formatMoney,
  TransferInstructions,
} from '@/ui/components/payment/transfer-instructions';

/** Poll cadence: fast at first, backing off, and giving up after a few minutes. */
const FIRST_POLL_MS = 1000;
const MAX_POLL_MS = 5000;
const POLL_BUDGET_MS = 3 * 60 * 1000;

type Presentation = {
  tone: 'success' | 'pending' | 'failure' | 'neutral';
  heading: string;
  body: string;
};

/* A Stripe bank transfer is cancelled at the end of its window; the payer is
 * told the date wherever the transfer still waits on them. */
function withWindow(view: PaymentView, body: string): string {
  if (view.gateway !== GATEWAY.stripeBankTransfer || !view.transferDeadline) {
    return body;
  }
  return `${body} ${i18n.t(
    'Send the transfer by {0}; after that it is cancelled.',
    formatDateTime(view.transferDeadline),
  )}`;
}

function presentationOf(view: PaymentView, gaveUp: boolean): Presentation {
  const amount = formatMoney(
    view.amount,
    view.currencyCode,
    view.currencyScale,
  );
  const captured = formatMoney(
    view.capturedAmount,
    view.currencyCode,
    view.currencyScale,
  );

  switch (view.status) {
    case PAYMENT_STATUS.captured:
      /* Resolved is an undeliverable purchase a person settled by hand: the
       * payer reads the same, since the portal did not complete it. */
      if (
        view.fulfilmentStatus === FULFILMENT_STATUS.undeliverable ||
        view.fulfilmentStatus === FULFILMENT_STATUS.resolved
      ) {
        return {
          tone: 'pending',
          heading: i18n.t('Payment received, order on hold'),
          body: i18n.t(
            'Your payment of {0} has been received. We could not complete your order automatically; our team will contact you.',
            amount,
          ),
        };
      }
      if (!view.registered) {
        return {
          tone: 'success',
          heading: i18n.t('Payment received'),
          body: gaveUp
            ? i18n.t(
                'Your payment of {0} has been received. We are finalising it and will email you when it is complete.',
                amount,
              )
            : i18n.t(
                'Your payment of {0} has been received. Finalising your order…',
                amount,
              ),
        };
      }
      return {
        tone: 'success',
        heading: i18n.t('Payment complete'),
        body: i18n.t(
          'Your payment of {0} has been received and recorded.',
          amount,
        ),
      };
    case PAYMENT_STATUS.partiallyCaptured:
      return {
        tone: 'pending',
        heading: i18n.t('Partly received'),
        body: withWindow(
          view,
          i18n.t(
            '{0} of {1} has been received. The remainder is still expected.',
            captured,
            amount,
          ),
        ),
      };
    case PAYMENT_STATUS.refused:
      return {
        tone: 'failure',
        heading: i18n.t('Payment declined'),
        body: i18n.t('The payment was declined. Nothing has been charged.'),
      };
    case PAYMENT_STATUS.cancelled:
      /* A bank transfer cancelled at the end of its window after part of it
       * arrived: that part stays in the payer's cash balance at Stripe, which
       * applies it to their next transfer unless it is refunded. */
      if (view.returnedToPayer && view.transferDeadline) {
        return {
          tone: 'neutral',
          heading: i18n.t('Payment cancelled'),
          body: i18n.t(
            'The transfer was cancelled after {0}. The {1} you sent will be used for your next bank transfer to us, or refunded to you.',
            formatDateTime(view.transferDeadline),
            formatMoney(
              view.returnedToPayer,
              view.currencyCode,
              view.currencyScale,
            ),
          ),
        };
      }
      return {
        tone: 'neutral',
        heading: i18n.t('Payment cancelled'),
        body: i18n.t('The payment was cancelled. Nothing has been charged.'),
      };
    case PAYMENT_STATUS.expired:
      return {
        tone: 'neutral',
        heading: i18n.t('This payment timed out'),
        body: i18n.t(
          'The payment was not completed in time. Nothing has been charged.',
        ),
      };
    case PAYMENT_STATUS.unconfirmed:
      /* No answer from the provider is no sign the payer was not charged, so
       * it reads as still waiting, never as failed or cancelled. */
      return {
        tone: 'pending',
        heading: i18n.t('Waiting for confirmation'),
        body: i18n.t(
          'We are still waiting for confirmation of your payment of {0}. We will email you once it is confirmed.',
          amount,
        ),
      };
    default:
      if (view.instructions) {
        return {
          tone: 'pending',
          heading: i18n.t('Waiting for your transfer'),
          body: withWindow(
            view,
            i18n.t(
              'Transfer {0} to the account below, quoting the transfer reference. We will email you once it has arrived.',
              amount,
            ),
          ),
        };
      }
      return {
        tone: 'pending',
        heading: i18n.t('Waiting for confirmation'),
        body: gaveUp
          ? i18n.t(
              'We are still waiting for confirmation of your payment of {0}. We will email you once it is confirmed.',
              amount,
            )
          : i18n.t('Confirming your payment of {0}…', amount),
      };
  }
}

const TONE_CLASSES: Record<Presentation['tone'], string> = {
  success: 'border-success bg-success-light text-success-dark',
  pending: 'border-palette-blue bg-palette-blue-light text-ink-900',
  failure: 'border-error bg-error-light text-error-dark',
  neutral: 'border-ink-200 bg-white text-ink-900',
};

export function PaymentResult({
  initial,
  statusPath,
}: {
  initial: PaymentView;
  statusPath: string;
}) {
  const [view, setView] = useState(initial);
  const [gaveUp, setGaveUp] = useState(false);
  const {scope} = useWorkspace();
  const router = useRouter();
  const startedAt = useRef<number | null>(null);

  /* Zero polls in the common case: the return route settled before the
   * redirect and the first render is already final. */
  useEffect(() => {
    if (view.settled || gaveUp) {
      return;
    }
    startedAt.current ??= Date.now();
    let delay = FIRST_POLL_MS;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - (startedAt.current ?? Date.now()) > POLL_BUDGET_MS) {
        setGaveUp(true);
        return;
      }
      try {
        const response = await fetch(statusPath, {cache: 'no-store'});
        if (response.ok) {
          const next = (await response.json()) as PaymentView;
          if (!cancelled) {
            setView(next);
            if (next.settled) {
              router.refresh();
              return;
            }
          }
        }
      } catch {
        /* A failed poll is retried on the next tick. */
      }
      delay = Math.min(delay * 2, MAX_POLL_MS);
      timer = setTimeout(tick, delay);
    };

    timer = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [view.settled, gaveUp, statusPath, router]);

  const presentation = presentationOf(view, gaveUp);
  /* The onward link goes back to the checkout for a payment that ended with
   * nothing charged, and on to what was bought otherwise. */
  const endedWithoutPayment =
    view.status === PAYMENT_STATUS.refused ||
    view.status === PAYMENT_STATUS.cancelled ||
    view.status === PAYMENT_STATUS.expired;
  const onwardHref = view.onwardLink ? scope.forRouter(view.onwardLink) : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div
        className={`rounded-lg border p-6 ${TONE_CLASSES[presentation.tone]}`}>
        <h1 className="text-2xl font-semibold">{presentation.heading}</h1>
        <p className="mt-2 text-base">{presentation.body}</p>
        <dl className="mt-6 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-500">{i18n.t('Payment reference')}</dt>
            <dd className="font-mono">{view.reference}</dd>
          </div>
          {view.subjectLabel && (
            <div>
              <dt className="text-ink-500">{i18n.t('For')}</dt>
              <dd>{view.subjectLabel}</dd>
            </div>
          )}
          <div>
            <dt className="text-ink-500">{i18n.t('Amount')}</dt>
            <dd>
              {formatMoney(view.amount, view.currencyCode, view.currencyScale)}
            </dd>
          </div>
          {view.capturedOn && (
            <div>
              <dt className="text-ink-500">{i18n.t('Received on')}</dt>
              <dd>{formatDateTime(view.capturedOn)}</dd>
            </div>
          )}
        </dl>
        {view.instructions && (
          <TransferInstructions
            className="mt-6"
            instructions={view.instructions}
            currencyCode={view.currencyCode}
            currencyScale={view.currencyScale}
          />
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {onwardHref && (
            <Button onClick={() => router.push(onwardHref)}>
              {endedWithoutPayment ? i18n.t('Try again') : i18n.t('Continue')}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(scope.forRouter())}>
            {i18n.t('Back to home')}
          </Button>
        </div>
      </div>
    </div>
  );
}
