import 'server-only';

import {z} from 'zod';

import {ensureAccess} from '@/access/ensure-access';
import {accessMessage} from '@/access/denial';
import {SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {getTranslation, t} from '@/locale/server';
import {tenantURLs} from '@/url/scope';
import {
  formatAmount,
  payerLocale,
  sendPaymentConfirmation,
} from '@/payment/confirmation';
import {resolveCurrency, toMinorUnits} from '@/payment/domain/money';
import {GATEWAY, PAYMENT_SOURCE} from '@/payment/domain/types';
import type {PaymentSourceHandler} from '@/payment/sources/types';
import {IdSchema} from '@/utils/validators';
import {scale} from '@/utils';

import {validateRegistration} from '../actions/validation';
import {RegistrationValuesSchema} from '../actions/validators';
import {getEventsConfig} from '../orm/config';
import {findEvent} from '../orm/event';
import {registerParticipants} from '../orm/registration';
import {announceRegistration} from '../utils/notify';
import {getCalculatedTotalPrice} from '../utils/payments';
import {SUBJECT_MODEL, subjectIdOf} from '@/payment/domain/subject';

const EventIntentSchema = z.object({
  eventId: IdSchema,
  values: RegistrationValuesSchema,
});

type EventIntent = z.infer<typeof EventIntentSchema>;

/* What delivery needs to register the participants the way the form asked:
 * the values as submitted, who submitted them (a guest when null) and the
 * configuration and workspace the registration rules are read from. */
const EventSnapshotSchema = z.object({
  eventId: z.string(),
  eventSlug: z.string(),
  values: RegistrationValuesSchema,
  registeredBy: z.object({id: z.string()}).nullable(),
  workspaceUrl: z.string(),
  configId: z.string(),
});

type EventSnapshot = z.infer<typeof EventSnapshotSchema>;

/**
 * Registering for a paid event. The registration does not exist before the
 * capture: delivery re-checks the event's rules and writes the registration
 * and its participants, and the ERP invoices it when it registers the payment.
 */
export const eventsPaymentSource: PaymentSourceHandler<
  EventIntent,
  typeof PAYMENT_SOURCE.events
> = {
  source: PAYMENT_SOURCE.events,

  intentSchema: EventIntentSchema,

  /* Only gateways that settle while the payer waits. A guest registers with no
   * account and no link to come back through, so a transfer that settled days
   * later would reach nobody. */
  gateways: [GATEWAY.stripeCard, GATEWAY.paypal, GATEWAY.paybox],

  async prepare({intent}) {
    const access = await ensureAccess({
      code: SUBAPP_CODES.events,
      allowGuest: true,
    });
    if (!access.ok) {
      return {error: true, message: await accessMessage(access.reason)};
    }
    const {user} = access;
    const {client, config: tenantConfig} = access.tenant;

    const config = await getEventsConfig(access.workspace.config.id, client);
    if (!config) {
      return {error: true, message: await t('Invalid workspace')};
    }
    if (!config.allowOnlinePaymentForEcommerce) {
      return {error: true, message: await t('Online payment is not available')};
    }
    if (!config.paymentOptionSet?.length) {
      return {
        error: true,
        message: await t('Payment options are not configured'),
      };
    }

    const validation = await validateRegistration({
      eventId: intent.eventId,
      values: intent.values,
      workspaceURL: access.workspace.url,
      config,
      user,
      client,
    });
    if (validation.error) {
      return validation;
    }

    const event = await findEvent({
      id: intent.eventId,
      user,
      client,
      config: tenantConfig,
      workspace: access.workspace,
    });
    if (!event) {
      return {error: true, message: await t('Invalid event')};
    }

    const {total} = getCalculatedTotalPrice(intent.values, event);
    const amount = Number(scale(total, event.priceScale));
    if (!amount || amount <= 0) {
      return {
        error: true,
        message: await t('Total price must be greater than 0'),
      };
    }

    /* A signed-in payer pays with their account's address; a guest with the one
     * they typed, which is also where the confirmation goes. */
    const payer = user ? user.email : intent.values.emailAddress;
    if (!payer) {
      return {error: true, message: await t('Email is required for payment')};
    }

    const currency = await resolveCurrency(client, event.currency?.code);
    const snapshot: EventSnapshot = {
      eventId: event.id,
      eventSlug: event.slug ?? '',
      values: intent.values,
      registeredBy: user ? {id: user.id} : null,
      workspaceUrl: access.workspace.url,
      configId: access.workspace.config.id,
    };

    return {
      success: true,
      data: {
        money: {
          amount: toMinorUnits(amount, currency.scale),
          currencyCode: currency.code,
          currencyScale: currency.scale,
        },
        payer,
        subjectLabel: `${await t('Event')}: ${event.eventTitle ?? event.id}`,
        paymentOptions: config.paymentOptionSet,
        billing: {
          firstName: intent.values.name,
          lastName: intent.values.surname,
        },
        workspace: {
          id: access.workspace.id,
          url: access.workspace.url,
          configId: access.workspace.config.id,
        },
        subject: null,
        snapshot,
      },
    };
  },

  async deliver({snapshot, txClient}) {
    const parsed = EventSnapshotSchema.safeParse(snapshot);
    if (!parsed.success) {
      return {
        delivered: false,
        reason: `The registration snapshot does not have the expected shape: ${z.prettifyError(parsed.error)}`,
      };
    }
    const {eventId, values, registeredBy, workspaceUrl, configId} = parsed.data;

    const config = await getEventsConfig(configId, txClient);
    if (!config) {
      return {
        delivered: false,
        reason: 'The app configuration the registration was made under is gone',
      };
    }

    /* The event may have filled up or closed, or a participant may have
     * registered by another route, between the button press and the capture.
     * Money captured for a registration that can no longer be honoured is a
     * human's to decide. The event row is locked first, so two captures for
     * the last seat are checked one after the other, not both against the
     * seat still free. */
    await txClient.$raw(
      'SELECT id FROM portal_portal_event WHERE id = $1 FOR UPDATE',
      eventId,
    );
    const validation = await validateRegistration({
      eventId,
      values,
      workspaceURL: workspaceUrl,
      config,
      user: registeredBy ?? undefined,
      client: txClient,
    });
    if (validation.error) {
      return {delivered: false, reason: validation.message};
    }

    const registration = await registerParticipants({
      eventId,
      participants: validation.data.participants,
      workspaceURL: workspaceUrl,
      client: txClient,
    });

    return {
      delivered: true,
      subject: {model: SUBJECT_MODEL.registration, id: registration.id},
    };
  },

  /* What a free registration tells its participants, now that the paid one
   * has been captured and written: the push and the registration mail, the
   * payer's own carrying what was paid. The ERP's own template mail, where the
   * workspace set one, still follows the registration. */
  async notify({payment, subject, snapshot, tenant}) {
    const registrationId = subjectIdOf(subject, SUBJECT_MODEL.registration);
    const parsed = EventSnapshotSchema.safeParse(snapshot);
    if (!registrationId || !parsed.success) {
      return;
    }
    const {registeredBy, workspaceUrl} = parsed.data;
    await announceRegistration({
      registrationId,
      registrant: registeredBy ? {id: registeredBy.id} : null,
      tenant,
      workspaceURL: workspaceUrl,
      payment: {
        amount: formatAmount(payment),
        reference: payment.reference,
        payer: payment.payer,
      },
      /* A signed-in payer who registered only other people gets no
       * registration mail, so the payment's own confirmation tells them. */
      onPayerNotParticipant: async () => {
        const translate = getTranslation.bind(null, {
          locale: await payerLocale(tenant, payment.payer),
          tenant: tenant.id,
        });
        const link = eventsPaymentSource.onwardLink({subject, snapshot});
        await sendPaymentConfirmation({
          tenant,
          payment,
          title: await translate('Payment received'),
          link:
            link &&
            tenantURLs(tenant.id)
              .workspaceByKey(payment.workspaceUrl)
              .forExternal(link),
          translate,
        });
      },
    });
  },

  onwardLink({snapshot}) {
    const parsed = EventSnapshotSchema.safeParse(snapshot);
    const slug = parsed.success ? parsed.data.eventSlug : null;
    if (!slug) {
      return `/${SUBAPP_CODES.events}`;
    }
    return `/${SUBAPP_CODES.events}/${slug}/${SUBAPP_PAGE.register}/${SUBAPP_PAGE.confirmation}`;
  },
};
