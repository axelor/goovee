import type {Client} from '@/goovee/.generated/client';

/**
 * The order request a shop checkout recorded when its payment was captured,
 * read back for the buyer it belongs to. The confirmation page is reached with
 * the id in the URL, so the partner and workspace clauses are what make a
 * tampered id resolve to nothing.
 */
export async function findOrderRequest({
  id,
  partnerId,
  workspaceId,
  client,
}: {
  id: string;
  partnerId: string;
  workspaceId: string;
  client: Client;
}) {
  return client.aOSPortalOrderRequest.findOne({
    where: {
      id,
      clientPartner: {id: partnerId},
      portalWorkspace: {id: workspaceId},
    },
    select: {
      saleOrder: {id: true},
    },
  });
}
