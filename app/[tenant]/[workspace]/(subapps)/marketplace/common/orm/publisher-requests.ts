import type {Client} from '@/goovee/.generated/client';
import {AOSMarketplacePublisherRequest} from '@/goovee/.generated/models';
import type {ID} from '@/types';
import {Payload} from '@goovee/orm';
import {PUBLISHER_REQUEST_STATUS} from '../constants/statuses';

const publisherRequestSelect = {
  statusSelect: true,
  cooldownUntil: true,
  rejectionReason: true,
} as const;

export type PublisherRequest = Payload<
  AOSMarketplacePublisherRequest,
  {select: typeof publisherRequestSelect}
>;

export type PublisherAccess = {
  /** The partner's publisher grant — the storefront's publish gate. */
  isPublisher: boolean;
  /** The current request row for this partner + workspace, if any. */
  request: PublisherRequest | null;
};

/**
 * Resolve a partner's publisher access for a workspace: the granted flag (from
 * the partner) and the current request row (for the request/cooldown state).
 */
export async function findPublisherAccess({
  client,
  partnerId,
  workspaceId,
}: {
  client: Client;
  partnerId: ID;
  workspaceId: ID;
}): Promise<PublisherAccess> {
  const [partner, request] = await Promise.all([
    client.aOSPartner.findOne({
      where: {id: partnerId},
      select: {isMarketplacePublisher: true},
    }),
    client.aOSMarketplacePublisherRequest.findOne({
      where: {partner: {id: partnerId}, portalWorkspace: {id: workspaceId}},
      select: publisherRequestSelect,
    }),
  ]);

  return {
    isPublisher: partner?.isMarketplacePublisher === true,
    request: request ?? null,
  };
}

/**
 * Whether the partner may submit a publisher request right now: no row yet, or a
 * temporary rejection whose cooldown has passed. Approved, pending and banned
 * rows cannot request.
 */
export function canRequestPublisherAccess(
  request: PublisherAccess['request'],
  now: Date = new Date(),
): boolean {
  if (!request) return true;
  if (request.statusSelect === PUBLISHER_REQUEST_STATUS.REJECTED) {
    return !request.cooldownUntil || new Date(request.cooldownUntil) <= now;
  }
  return false;
}
