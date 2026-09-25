'use client';

import {useRef, useState} from 'react';
import {CreditCard, Landmark} from 'lucide-react';
import {
  PayPalOneTimePaymentButton,
  PayPalProvider,
} from '@paypal/react-paypal-js/sdk-v6';

// ---- CORE IMPORTS ---- //
import {i18n, l10n} from '@/locale';
import {transformLocale} from '@/locale/utils';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Portal,
  Spinner,
} from '@/ui/components';
import {useToast} from '@/ui/hooks';
import {useEnvironment} from '@/environment';
import {
  GATEWAY,
  type Gateway,
  type PaymentSource,
} from '@/payment/domain/types';
import {startPaymentAction} from '@/payment/actions';
import type {OfferedGateway} from '@/payment/offer';
import type {StartResult} from '@/payment/start';
import styles from './payment-methods.module.scss';

type GatewayPresentation = {
  /** Written as literal calls so the keys stay visible to the extractor. */
  label: (option?: string) => string;
  className: string;
};

/* Stripe's gateways share one provider account and one button, so they are
 * presented together below rather than one button each. */
type StripeGateway =
  | typeof GATEWAY.stripeCard
  | typeof GATEWAY.stripeBankTransfer;

const STRIPE_GATEWAYS: readonly Gateway[] = [
  GATEWAY.stripeCard,
  GATEWAY.stripeBankTransfer,
];

const isStripe = (offered: OfferedGateway) =>
  STRIPE_GATEWAYS.includes(offered.gateway);

const PRESENTATION: Record<
  Exclude<Gateway, StripeGateway>,
  GatewayPresentation
> = {
  [GATEWAY.paypal]: {
    label: () => i18n.t('Pay with PayPal'),
    className: 'bg-[#ffc439] text-ink-900',
  },
  [GATEWAY.paybox]: {
    label: () => i18n.t('Pay with Paybox'),
    className: 'bg-[#e30613]',
  },
  [GATEWAY.up2pay]: {
    label: () => i18n.t('Pay with Up2Pay'),
    className: 'bg-[#00a651]',
  },
  [GATEWAY.hubpisp]: {
    label: option =>
      option === 'instant'
        ? i18n.t('Pay from your bank (instant transfer)')
        : i18n.t('Pay from your bank (standard transfer)'),
    className: 'bg-[#1d4ed8]',
  },
};

type Handoff = StartResult['handoff'];

/**
 * Performs the handoff the server answered with. A button starts a payment
 * and nothing else: everything after this belongs to a route or a page,
 * because the browser may never come back to where it left.
 */
function performHandoff(handoff: Handoff): boolean {
  switch (handoff.kind) {
    case 'redirect':
    case 'page':
      window.location.assign(handoff.url);
      return true;
    case 'form-post': {
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = handoff.url;
      for (const [name, value] of Object.entries(handoff.fields)) {
        const field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        field.value = value;
        form.appendChild(field);
      }
      document.body.appendChild(form);
      form.submit();
      return true;
    }
    /* Taken by the provider's own button, which drives its SDK; one reaching
     * a plain button is a gateway offered through the wrong control. */
    case 'sdk':
      return false;
    default: {
      /* Every kind a start can answer with is handled above; a new one fails
       * the type check here rather than doing nothing in the browser. */
      const unhandled: never = handoff;
      return unhandled;
    }
  }
}

/** What is being paid for, or a function that reads it at press time, such as from a form. */
type IntentInput = Record<string, unknown> | (() => Record<string, unknown>);

type StartArgs = {
  source: PaymentSource;
  intent: IntentInput;
  checkoutToken: string;
};

type Starter = (offered: OfferedGateway) => Promise<Handoff | null>;

/**
 * PayPal approves the order in its own window and never redirects the browser
 * itself, so its button is the SDK's: the order is created when the buyer
 * presses it and, once approved, the browser is sent to the same return route
 * every other gateway uses, which captures and settles.
 */
function PaypalButton({disabled, start}: {disabled?: boolean; start: Starter}) {
  const env = useEnvironment();
  const {toast} = useToast();
  const [completing, setCompleting] = useState(false);
  const handoff = useRef<Extract<Handoff, {kind: 'sdk'}> | null>(null);

  const createOrder = async (): Promise<{orderId: string}> => {
    const result = await start({gateway: GATEWAY.paypal});
    /* Already paid under this checkout: show the result rather than a second
     * PayPal window. The SDK is told to stop by the rejection that follows. */
    if (result?.kind === 'page') {
      setCompleting(true);
      window.location.assign(result.url);
    }
    if (!result || result.kind !== 'sdk') {
      throw new Error('PayPal order was not created');
    }
    handoff.current = result;
    return {orderId: result.orderId};
  };

  /* Both ways out of PayPal's window go through the return route, which asks
   * PayPal what became of the order: an approval is captured, an abandon is
   * recorded as cancelled, and the result page shows either. */
  const complete = (orderId: string, cancelled: boolean) => {
    const current = handoff.current;
    if (!current || current.orderId !== orderId) {
      toast({
        variant: 'destructive',
        title: i18n.t('The payment could not be completed. Please try again.'),
      });
      return;
    }
    setCompleting(true);
    const completeUrl = new URL(current.completeUrl);
    completeUrl.searchParams.set('token', orderId);
    if (cancelled) {
      completeUrl.searchParams.set('outcome', 'cancel');
    }
    window.location.assign(completeUrl.toString());
  };

  const onApprove = async ({orderId}: {orderId: string}): Promise<void> => {
    complete(orderId, false);
  };

  const onCancel = ({orderId}: {orderId?: string}): void => {
    const cancelled = orderId ?? handoff.current?.orderId;
    if (cancelled) {
      complete(cancelled, true);
    }
  };

  const onError = (): void => {
    toast({
      variant: 'destructive',
      title: i18n.t('The payment could not be completed. Please try again.'),
    });
  };

  return (
    <PayPalProvider
      clientId={env.paypal?.clientId ?? ''}
      components={['paypal-payments']}
      locale={transformLocale(l10n.getLocale()) || undefined}
      pageType="checkout">
      <div className={`w-full ${styles.paypal}`}>
        <PayPalOneTimePaymentButton
          disabled={disabled}
          presentationMode="auto"
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onError}
        />
      </div>
      <Portal>
        <Spinner show={completing} fullscreen />
      </Portal>
    </PayPalProvider>
  );
}

type StripeOption = {
  offered: OfferedGateway;
  icon: typeof CreditCard;
  /** Written as literal calls so the keys stay visible to the extractor. */
  title: () => string;
  description: () => string;
};

/**
 * One button for however many Stripe gateways the source is offered. Card
 * alone goes straight to Stripe's checkout; with a bank transfer on offer too
 * the buyer chooses first. A transfer is confirmed before it starts, because
 * Stripe applies whatever cash balance the buyer already holds with it the
 * moment the transfer is created.
 */
function StripeButton({
  offers,
  disabled,
  busy,
  validate,
  launch,
}: {
  offers: OfferedGateway[];
  disabled?: boolean;
  busy: boolean;
  /** The caller's pre-flight, run before any choice is shown. */
  validate: () => Promise<boolean>;
  /** Starts an already-validated gateway and performs its handoff. */
  launch: (offered: OfferedGateway) => Promise<void>;
}) {
  const [choosing, setChoosing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [validating, setValidating] = useState(false);

  const card = offers.find(offered => offered.gateway === GATEWAY.stripeCard);
  const transfer = offers.find(
    offered => offered.gateway === GATEWAY.stripeBankTransfer,
  );

  const options: StripeOption[] = [
    ...(card
      ? [
          {
            offered: card,
            icon: CreditCard,
            title: () => i18n.t('Credit or Debit Card'),
            description: () => i18n.t('Pay immediately with your card'),
          },
        ]
      : []),
    ...(transfer
      ? [
          {
            offered: transfer,
            icon: Landmark,
            title: () => i18n.t('Bank Transfer'),
            description: () =>
              i18n.t('Pay via bank transfer (1-3 business days)'),
          },
        ]
      : []),
  ];

  const choose = (offered: OfferedGateway) => {
    setChoosing(false);
    if (offered.gateway === GATEWAY.stripeBankTransfer) {
      setConfirming(true);
      return;
    }
    void launch(offered);
  };

  /* The pre-flight can take a while — a form re-validates itself — so the
   * button stays disabled until it answers. */
  const open = async () => {
    if (validating) return;
    setValidating(true);
    try {
      if (!(await validate())) {
        return;
      }
    } finally {
      setValidating(false);
    }
    if (options.length === 1) {
      choose(options[0].offered);
      return;
    }
    setChoosing(true);
  };

  return (
    <>
      <Button
        type="button"
        className="h-[50px] w-full bg-[#635bff] text-lg font-medium hover:bg-[#5851e0]"
        disabled={disabled || validating}
        onClick={open}>
        {busy ? i18n.t('Redirecting…') : i18n.t('Pay with Stripe')}
      </Button>

      <Dialog open={choosing} onOpenChange={setChoosing}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {i18n.t('Select Payment Method (Stripe)')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {options.map(({offered, icon: Icon, title, description}) => (
              <button
                key={offered.gateway}
                type="button"
                className="flex items-center gap-3 rounded-lg border border-ink-200 p-3 text-left hover:bg-ink-50"
                onClick={() => choose(offered)}>
                <Icon className="h-6 w-6 shrink-0 text-ink-700" />
                <span>
                  <span className="block font-medium text-ink-900">
                    {title()}
                  </span>
                  <span className="block text-sm text-ink-500">
                    {description()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{i18n.t('Confirm Bank Transfer')}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {i18n.t(
                    'Bank transfers may immediately use your existing Stripe balance.',
                  )}
                </p>
                <p className="text-sm text-ink-500">
                  {i18n.t(
                    'If you already have sufficient balance, this payment will be completed instantly and funds will be deducted.',
                  )}
                </p>
                <p className="text-sm font-medium text-ink-500">
                  {i18n.t('This action cannot be undone.')}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirming(false)}>
              {i18n.t('Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirming(false);
                if (transfer) {
                  void launch(transfer);
                }
              }}>
              {i18n.t('Continue')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function keyOf(offered: OfferedGateway): string {
  return offered.option
    ? `${offered.gateway}:${offered.option}`
    : offered.gateway;
}

/**
 * One button per gateway the server offers, except Stripe's, which share one.
 * The intent is opaque here: the component sends `{source, intent,
 * checkoutToken}` and the server prices it.
 */
export function PaymentMethods({
  gateways,
  source,
  intent,
  checkoutToken,
  disabled,
  onValidate,
}: StartArgs & {
  gateways: OfferedGateway[];
  disabled?: boolean;
  /** The caller's pre-flight: an address chosen, an amount above zero. */
  onValidate?: (gateway: Gateway) => Promise<boolean> | boolean;
}) {
  const {toast} = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  /* `busy` is state, so two presses handled in the same render both read it
   * as clear; this is what actually stops a second payment from starting. */
  const starting = useRef(false);

  if (gateways.length === 0) {
    return null;
  }

  const validate = async (gateway: Gateway) =>
    !onValidate || (await onValidate(gateway));

  /* Starts the payment on the server and returns the handoff, or null after
   * showing why not. */
  const begin: Starter = async offered => {
    try {
      const result = await startPaymentAction({
        gateway: offered.gateway,
        option: offered.option,
        source,
        intent: typeof intent === 'function' ? intent() : intent,
        checkoutToken,
      });
      if (result.error) {
        toast({variant: 'destructive', title: result.message});
        return null;
      }
      return result.data.handoff;
    } catch {
      toast({
        variant: 'destructive',
        title: i18n.t('The payment could not be started. Please try again.'),
      });
      return null;
    }
  };

  /* Validates, then starts. Shared by the plain buttons and the SDK one. */
  const start: Starter = async offered =>
    (await validate(offered.gateway)) ? begin(offered) : null;

  const run = async (offered: OfferedGateway, starter: Starter) => {
    if (starting.current) return;
    starting.current = true;
    setBusy(keyOf(offered));
    try {
      const handoff = await starter(offered);
      if (handoff && !performHandoff(handoff)) {
        toast({
          variant: 'destructive',
          title: i18n.t('This payment method is not available yet'),
        });
      }
    } finally {
      starting.current = false;
      setBusy(null);
    }
  };

  const press = (offered: OfferedGateway) => run(offered, start);
  /* For a button that validated before letting the buyer choose. */
  const launch = (offered: OfferedGateway) => run(offered, begin);

  const stripeOffers = gateways.filter(isStripe);
  const stripeBusy = stripeOffers.some(offered => keyOf(offered) === busy);

  return (
    <div className="flex flex-col gap-3">
      {gateways.map(offered => {
        const key = keyOf(offered);
        const {gateway} = offered;
        if (
          gateway === GATEWAY.stripeCard ||
          gateway === GATEWAY.stripeBankTransfer
        ) {
          /* Rendered once, where the first Stripe gateway falls in the order. */
          if (offered !== stripeOffers[0]) {
            return null;
          }
          return (
            <StripeButton
              key="stripe"
              offers={stripeOffers}
              disabled={disabled || busy !== null}
              busy={stripeBusy}
              /* The caller's pre-flight does not depend on which Stripe gateway
               * the buyer will pick, and it has to pass before they pick. */
              validate={() => validate(gateway)}
              launch={launch}
            />
          );
        }
        if (gateway === GATEWAY.paypal) {
          return (
            <PaypalButton
              key={key}
              disabled={disabled || busy !== null}
              start={start}
            />
          );
        }
        const presentation = PRESENTATION[gateway];
        return (
          <Button
            key={key}
            type="button"
            className={`h-[50px] w-full text-lg font-medium ${presentation.className}`}
            disabled={disabled || busy !== null}
            onClick={() => press(offered)}>
            {busy === key
              ? i18n.t('Redirecting…')
              : presentation.label(offered.option)}
          </Button>
        );
      })}
    </div>
  );
}

export default PaymentMethods;
