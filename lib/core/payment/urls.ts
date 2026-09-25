import 'server-only';

import {tenantURLs} from '@/url/scope';

/** The result page: the one place a payment's outcome is shown. */
export function paymentPageUrl(
  tenantId: string,
  workspaceUrl: string,
  reference: string,
): string {
  return tenantURLs(tenantId)
    .workspaceByKey(workspaceUrl)
    .forExternal(`/payments/${reference}`);
}

/** The status endpoint the result page polls. */
export function paymentStatusPath(tenantId: string, reference: string): string {
  return tenantURLs(tenantId).forExternal(`/api/payments/${reference}/status`);
}
