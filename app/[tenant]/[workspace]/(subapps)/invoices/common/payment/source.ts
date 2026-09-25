import 'server-only';

import {z} from 'zod';

import {IdSchema} from '@/utils/validators';
import {currentWorkspace} from '@/url/current';
import {tenantURLs} from '@/url/scope';
import {getTranslation, t} from '@/locale/server';
import {SUBAPP_CODES} from '@/constants';
import {
  fromMinorUnits,
  toMinorUnits,
  resolveCurrency,
} from '@/payment/domain/money';
import {GATEWAY, PAYMENT_SOURCE} from '@/payment/domain/types';
import type {PaymentSourceHandler} from '@/payment/sources/types';
import {formatDateTime} from '@/locale/formatters';
import {transferDeadline} from '@/payment/domain/transfers';
import {findPartlyFundedTransfer, invoiceRemaining} from '@/payment/transfers';
import {payerLocale, sendPaymentConfirmation} from '@/payment/confirmation';
import {notifyInvoicePaymentSuccess} from '@/subapps/invoices/common/utils/notify';
import {
  resolveInvoicePaymentAccess,
  validatePaymentData,
} from '@/subapps/invoices/common/utils/validations';
import {INVOICE_PAYMENT_OPTIONS} from '@/subapps/invoices/common/constants/invoices';
import {SUBJECT_MODEL, subjectIdOf} from '@/payment/domain/subject';

const InvoiceIntentSchema = z.object({
  invoiceId: IdSchema,
  /** The amount the payer chose, as a decimal string; checked against the invoice and the workspace's policy. */
  amount: z.string().min(1),
  token: z.string().min(1).max(255).optional(),
});

type InvoiceIntent = z.infer<typeof InvoiceIntentSchema>;

const InvoiceSnapshotSchema = z.object({
  invoiceId: z.string(),
  token: z.string().nullable(),
});

type InvoiceSnapshot = z.infer<typeof InvoiceSnapshotSchema>;

/**
 * Paying an invoice that already exists in the ERP. The subject is known from
 * the start and nothing goovee-local happens on capture; the ERP records the
 * invoice payment when it registers the payment.
 */
export const invoicesPaymentSource: PaymentSourceHandler<
  InvoiceIntent,
  typeof PAYMENT_SOURCE.invoices
> = {
  source: PAYMENT_SOURCE.invoices,

  intentSchema: InvoiceIntentSchema,

  /* Every gateway, the asynchronous ones included: an invoice payer can always
   * come back to the invoice — signed in, or through the invoice's own link —
   * and see a transfer that settled days later applied to it. */
  gateways: [
    GATEWAY.stripeCard,
    GATEWAY.stripeBankTransfer,
    GATEWAY.hubpisp,
    GATEWAY.paypal,
    GATEWAY.paybox,
    GATEWAY.up2pay,
  ],

  async prepare({intent, tenant}) {
    const scope = await currentWorkspace();
    if (!scope) {
      return {error: true, message: await t('Invalid workspace')};
    }

    const access = await resolveInvoicePaymentAccess({
      workspaceURL: scope.key(),
      tenantId: tenant.id,
      token: intent.token,
    });
    if (access.error) {
      return access;
    }
    const {config, user, invoiceFilter, workspaceURL} = access.data;

    const validated = await validatePaymentData({
      config,
      client: tenant.client,
      invoice: {id: intent.invoiceId},
      amount: intent.amount,
      invoiceFilter,
      workspaceURL,
      tenantId: tenant.id,
    });
    if (validated.error) {
      return validated;
    }
    const {$amount, $invoice, isPartialPayment} = validated.data;

    /* A transfer that has received part of its amount stays open for the
     * rest until its window ends, when the portal cancels it and the part
     * that arrived goes back to the payer; paid another way meanwhile, the
     * invoice would be paid twice once the rest arrives. So the payer
     * completes that transfer, whatever method this start names, or waits for
     * its window to end. */
    const partlyFunded = await findPartlyFundedTransfer({
      client: tenant.client,
      invoiceId: $invoice.id,
    });
    if (partlyFunded) {
      return {
        error: true,
        message: await t(
          'A bank transfer on this invoice has already received part of its amount. Send the remaining {0} by {1} using its bank details under pending transfers; another payment can be made once it completes, or once it is cancelled after that date.',
          `${fromMinorUnits(
            partlyFunded.amount - partlyFunded.received,
            partlyFunded.currencyScale,
          )} ${partlyFunded.currencyCode}`,
          /* As the pending list and the result page show it. A session has
           * always recorded its start; were one not to, its window is
           * counted from now. */
          formatDateTime(
            transferDeadline(partlyFunded.startedOn ?? new Date()),
          ),
        ),
      };
    }

    const payer = intent.token
      ? $invoice.partner?.emailAddress?.address
      : user?.email;
    if (!payer) {
      return {error: true, message: await t('Email is required for payment')};
    }

    const workspace = await tenant.client.aOSPortalWorkspace.findOne({
      where: {url: workspaceURL},
      select: {id: true, url: true},
    });
    if (!workspace?.url) {
      return {error: true, message: await t('Invalid workspace')};
    }

    const currency = await resolveCurrency(
      tenant.client,
      $invoice.currency?.code,
    );

    /* The ERP learns of a capture only once it is registered, so its remaining
     * amount still counts money already taken. What is owed is judged on the
     * ledger too, or a second payment could start while the first is on its
     * way to the ERP. An invoice that cannot be judged this way keeps the
     * ERP's figure, checked above. */
    const owed = await invoiceRemaining({
      client: tenant.client,
      invoiceId: $invoice.id,
      currencyCode: currency.code,
      scale: currency.scale,
    });
    if ('remaining' in owed) {
      const requested = toMinorUnits($amount, currency.scale);
      if (owed.remaining <= 0) {
        return {
          error: true,
          message: await t(
            'A payment on this invoice is being finalised. Try again in a few minutes.',
          ),
        };
      }
      if (
        config.canPayInvoice === INVOICE_PAYMENT_OPTIONS.TOTAL &&
        requested !== owed.remaining
      ) {
        return {
          error: true,
          message: await t('Payment must match the total amount'),
        };
      }
      if (requested > owed.remaining) {
        return {
          error: true,
          message: await t('Payment exceeds the remaining amount.'),
        };
      }
    }

    const snapshot: InvoiceSnapshot = {
      invoiceId: $invoice.id,
      token: intent.token ?? null,
    };

    return {
      success: true,
      data: {
        money: {
          amount: toMinorUnits($amount, currency.scale),
          currencyCode: currency.code,
          currencyScale: currency.scale,
        },
        payer,
        /* Says a part is paid when it is, so a completed payment of part of
         * the invoice never reads as the invoice paid. */
        subjectLabel: isPartialPayment
          ? await t(
              'Part payment of invoice {0}',
              String($invoice.invoiceId ?? $invoice.id),
            )
          : await t('Invoice {0}', String($invoice.invoiceId ?? $invoice.id)),
        paymentOptions: config.paymentOptionSet,
        billing: {
          firstName: $invoice.partner?.firstName ?? undefined,
          lastName: $invoice.partner?.name ?? undefined,
          addressLine1: $invoice.address?.addressl4 ?? undefined,
          zipCode: $invoice.address?.zip ?? undefined,
          city: $invoice.address?.city?.name ?? undefined,
          countryCode: $invoice.address?.country?.numericCode ?? undefined,
        },
        workspace: {id: workspace.id, url: workspace.url, configId: config.id},
        subject: {model: SUBJECT_MODEL.invoice, id: $invoice.id},
        snapshot,
      },
    };
  },

  async deliver() {
    return {delivered: true, subject: null};
  },

  /* The push the payer's portal account always had, now on every method, and
   * a mail: an invoice paid through its link has no account to push to. */
  async notify({payment, subject, snapshot, tenant}) {
    const invoiceId = subjectIdOf(subject, SUBJECT_MODEL.invoice);
    if (!invoiceId) {
      return;
    }
    const invoice = await tenant.client.aOSInvoice.findOne({
      where: {id: invoiceId},
      select: {invoiceId: true},
    });
    const invoiceNumber = String(invoice?.invoiceId ?? invoiceId);

    const translate = getTranslation.bind(null, {
      locale: await payerLocale(tenant, payment.payer),
      tenant: tenant.id,
    });
    const link = invoicesPaymentSource.onwardLink({subject, snapshot});
    await sendPaymentConfirmation({
      tenant,
      payment,
      title: await translate('Payment received for invoice {0}', invoiceNumber),
      link:
        link &&
        tenantURLs(tenant.id)
          .workspaceByKey(payment.workspaceUrl)
          .forExternal(link),
      translate,
    });

    if (payment.payer) {
      await notifyInvoicePaymentSuccess({
        invoiceId,
        payer: payment.payer,
        client: tenant.client,
        tenantId: tenant.id,
      });
    }
  },

  onwardLink({subject, snapshot}) {
    const parsed = InvoiceSnapshotSchema.safeParse(snapshot);
    const invoiceId =
      subjectIdOf(subject, SUBJECT_MODEL.invoice) ??
      (parsed.success ? parsed.data.invoiceId : null);
    if (!invoiceId) {
      return null;
    }
    const token = parsed.success ? parsed.data.token : null;
    return `/${SUBAPP_CODES.invoices}/${invoiceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};
