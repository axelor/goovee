import {NextResponse} from 'next/server';
import {
  MOBILE_PROTOCOL_VERSION,
  type MobilePortalStatus,
} from '@/mobile/contract';
import {isMobileAppEnabled} from '@/mobile/enabled';
import {getTenantConfig} from '@/tenant/config';

type Params = {params: Promise<{tenant: string}>};

/*
 * Tells the mobile app whether it can open this portal. Asked before anyone
 * signs in, so it needs no session.
 */
export async function GET(_request: Request, props: Params) {
  const {tenant: tenantId} = await props.params;

  const tenantConfig = getTenantConfig(tenantId);
  if (!tenantConfig) {
    return new NextResponse('Not found', {status: 404});
  }

  const status: MobilePortalStatus = {
    enabled: isMobileAppEnabled(tenantConfig.public),
    protocolVersion: MOBILE_PROTOCOL_VERSION,
  };
  return NextResponse.json(status, {headers: {'Cache-Control': 'no-store'}});
}
