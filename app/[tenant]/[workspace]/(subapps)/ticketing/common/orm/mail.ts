import {SUBAPP_CODES} from '@/constants';
import {manager, type Tenant} from '@/tenant';
import type {ID} from '@/types';
import type {Maybe} from '@/types/util';

export async function getMailRecipients({
  contacts,
  workspaceURL,
  tenantId,
}: {
  contacts: Array<{id: Maybe<ID>}>;
  workspaceURL: string;
  tenantId: Tenant['id'];
}): Promise<NotificationPartner[]> {
  const reciepients = await Promise.all(
    contacts.map(
      contact =>
        contact.id &&
        findPartnerNotificationEmail({id: contact.id, workspaceURL, tenantId}),
    ),
  );

  return reciepients.filter(Boolean) as NotificationPartner[];
}

export type NotificationPartner = NonNullable<
  Awaited<ReturnType<typeof findPartnerNotificationEmail>>
>;

export async function findPartnerNotificationEmail({
  id,
  workspaceURL,
  tenantId,
}: {
  id: ID;
  workspaceURL: string;
  tenantId: Tenant['id'];
}) {
  const client = await manager.getClient(tenantId);

  const partner = await client.aOSPartner.findOne({
    where: {
      id,
      portalUserPreferenceList: {
        app: {code: SUBAPP_CODES.ticketing},
        workspace: {url: workspaceURL},
        activateNotification: true,
      },
      emailAddress: {address: {ne: null}},
    },
    select: {emailAddress: {address: true}, localization: {code: true}},
  });

  return partner;
}
