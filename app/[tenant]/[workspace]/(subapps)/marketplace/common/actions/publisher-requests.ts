'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {z} from 'zod';
import {PUBLISHER_REQUEST_STATUS} from '../constants/statuses';
import {canManageProducts} from '../utils/auth-helper';
import {getMarketplaceConfig} from '../orm/config';
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessMessage} from '@/lib/core/access/denial';
import {getPartnerId} from '@/utils';

const requestPublisherAccessSchema = z.object({
  workspaceURL: z.string().min(1),
  publishingPlan: z.string().trim().min(1).max(2000),
});

type RequestPublisherAccessInput = z.infer<typeof requestPublisherAccessSchema>;

/**
 * Submit (or re-open) this partner's publisher access request for the workspace.
 * Idempotent: a no-op when already pending or approved; re-opens a temporary
 * rejection once its cooldown has passed; refuses a banned partner. Only
 * total/admin contacts may request, and only where publishing is offered.
 */
export async function requestPublisherAccess(
  input: RequestPublisherAccessInput,
): ActionResponse<{status: number}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = requestPublisherAccessSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {workspaceURL, publishingPlan} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {client} = access.tenant;
  const config = await getMarketplaceConfig(access.workspace.config.id, client);

  if (!config?.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }
  if (!canManageProducts({user: access.user, subapp: access.subapp})) {
    return {
      error: true,
      message: await t(
        'You do not have permission to request publisher access.',
      ),
    };
  }

  const partnerId = getPartnerId(access.user);
  const workspaceId = access.workspace.id;
  const contactId = access.user.isContact ? String(access.user.id) : partnerId;

  try {
    const existing = await client.aOSMarketplacePublisherRequest.findOne({
      where: {partner: {id: partnerId}, portalWorkspace: {id: workspaceId}},
      select: {statusSelect: true, cooldownUntil: true},
    });

    /* Already pending or approved: nothing to do. */
    if (
      existing?.statusSelect === PUBLISHER_REQUEST_STATUS.REQUESTED ||
      existing?.statusSelect === PUBLISHER_REQUEST_STATUS.APPROVED
    ) {
      return {success: true, data: {status: existing.statusSelect}};
    }

    /* Banned: a permanent block. */
    if (existing?.statusSelect === PUBLISHER_REQUEST_STATUS.BANNED) {
      return {
        error: true,
        message: await t('Publisher access is not available for your account.'),
      };
    }

    /* Rejected: re-openable only once the cooldown has passed. */
    if (
      existing?.statusSelect === PUBLISHER_REQUEST_STATUS.REJECTED &&
      existing.cooldownUntil &&
      new Date(existing.cooldownUntil) > new Date()
    ) {
      const when = new Date(existing.cooldownUntil).toLocaleDateString();
      const template = await t(
        'You can request publisher access again after {date}.',
      );
      return {error: true, message: template.replace('{date}', when)};
    }

    if (existing) {
      await client.aOSMarketplacePublisherRequest.update({
        data: {
          id: existing.id,
          version: existing.version,
          statusSelect: PUBLISHER_REQUEST_STATUS.REQUESTED,
          cooldownUntil: null,
          rejectionReason: null,
          publishingPlan,
          requestDateTime: new Date(),
          requestedByContact: {select: {id: contactId}},
        },
        select: {id: true},
      });
    } else {
      await client.aOSMarketplacePublisherRequest.create({
        data: {
          statusSelect: PUBLISHER_REQUEST_STATUS.REQUESTED,
          publishingPlan,
          requestDateTime: new Date(),
          partner: {select: {id: partnerId}},
          portalWorkspace: {select: {id: workspaceId}},
          requestedByContact: {select: {id: contactId}},
        },
        select: {id: true},
      });
    }

    return {success: true, data: {status: PUBLISHER_REQUEST_STATUS.REQUESTED}};
  } catch {
    return {error: true, message: await t('An error occurred')};
  }
}
