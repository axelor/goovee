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
  /** Whether the partner may publish in this workspace — the publish gate. */
  isPublisher: boolean;
  /** The request row for this partner + workspace, if any. */
  request: PublisherRequest | null;
};

/**
 * Resolve a partner's publisher access for one workspace. The request row for
 * the pair is the grant: an approved row is access, and any other status (or no
 * row) withholds it. Access is therefore per workspace — a decision taken in one
 * says nothing about another.
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
  const request = await client.aOSMarketplacePublisherRequest.findOne({
    where: {partner: {id: partnerId}, portalWorkspace: {id: workspaceId}},
    select: publisherRequestSelect,
  });

  return {
    isPublisher: request?.statusSelect === PUBLISHER_REQUEST_STATUS.APPROVED,
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
