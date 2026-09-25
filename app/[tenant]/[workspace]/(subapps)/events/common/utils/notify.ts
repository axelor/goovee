import 'server-only';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {DEFAULT_LOCALE} from '@/locale/contants';
import {getTranslation} from '@/locale/server';
import {notifyAll} from '@/pwa/utils';
import {NotificationTag} from '@/pwa/tags';
import {isSameEmail} from '@/payment/domain/email';
import type {Tenant} from '@/tenant';
import {tenantURLs} from '@/url/scope';

// ---- LOCAL IMPORTS ---- //
import {
  findRegistrationNotice,
  type RegistrationNotice,
} from '../orm/registration';
import {sendRegistrationMail} from './mail';

/** Whoever made the registration, told nothing by push for having just done it. Null for a guest. */
export type Registrant = {id?: string; email?: string} | null;

type NoticeContact = NonNullable<
  NonNullable<RegistrationNotice['participantList']>[number]['contact']
>;

function isRegistrant(contact: NoticeContact, registrant: Registrant) {
  if (!registrant) return false;
  if (registrant.id && contact.id === registrant.id) return true;
  return Boolean(
    registrant.email && contact.emailAddress?.address === registrant.email,
  );
}

/**
 * What a registration tells its participants: a push to each one with a
 * portal account, other than whoever registered, and the registration mail
 * with its invite to every one of them. The same for a free registration and
 * a paid one, and it leans on no request, so a paid registration's
 * confirmation job can send it from the job clock.
 *
 * The mail and the push are handed off, the mail first, and neither is
 * waited on: their delivery and retries are the mail and push services'.
 *
 * A paid registration's amount and reference go only in the payer's own
 * mail. A payer who registered other people and not themselves is in no
 * participant's mail, so `onPayerNotParticipant` runs for them once the
 * registration mails are handed over and before the push.
 */
export async function announceRegistration({
  registrationId,
  registrant,
  tenant,
  workspaceURL,
  payment,
  onPayerNotParticipant,
}: {
  registrationId: string;
  registrant: Registrant;
  tenant: Tenant;
  workspaceURL: string;
  /** A paid registration's payment, shown in its payer's mail; absent for a free one. */
  payment?: {amount: string; reference: string; payer: string | null};
  /** Tells a payer who is none of the participants what they paid. */
  onPayerNotParticipant?: () => Promise<void>;
}): Promise<void> {
  const notice = await findRegistrationNotice({
    id: registrationId,
    client: tenant.client,
  });
  const event = notice?.event;
  if (!notice || !event) {
    console.error(
      `[MAIL] Registration ${registrationId} or its event was not found.`,
    );
    return;
  }
  const eventPath = `/${SUBAPP_CODES.events}/${event.slug}` as const;

  /* In the mail's own language: the registration mail is written in the
   * default one, so its added lines are too. */
  const translate = getTranslation.bind(null, {
    locale: DEFAULT_LOCALE,
    tenant: tenant.id,
  });
  const receipt =
    payment?.payer != null
      ? {
          payer: payment.payer,
          lines: [
            [await translate('Amount'), payment.amount],
            [await translate('Payment reference'), payment.reference],
          ] as const,
        }
      : undefined;

  await sendRegistrationMail({
    notice,
    eventLink: tenantURLs(tenant.id)
      .workspaceByKey(workspaceURL)
      .forExternal(eventPath),
    config: tenant.config,
    receipt,
  });

  const payerIsParticipant = (notice.participantList ?? []).some(participant =>
    isSameEmail(participant.emailAddress, payment?.payer),
  );
  if (payment && !payerIsParticipant) {
    await onPayerNotParticipant?.();
  }

  const recipients = (notice.participantList ?? []).flatMap(participant =>
    participant.contact?.isActivatedOnPortal &&
    !isRegistrant(participant.contact, registrant)
      ? [participant.contact]
      : [],
  );

  void notifyAll(recipients, async contact => {
    const translate = getTranslation.bind(null, {
      locale: contact.localization?.code || DEFAULT_LOCALE,
      tenant: tenant.id,
    });

    return {
      userId: contact.id,
      tenantId: tenant.id,
      workspaceURL,
      client: tenant.client,
      payload: {
        title: await translate('You have been registered for an event!'),
        body: `${event.eventTitle}`,
        link: eventPath,
        tag: NotificationTag.event(event.id),
      },
    };
  });
}
