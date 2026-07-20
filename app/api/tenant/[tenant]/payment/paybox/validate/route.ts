export const dynamic = 'force-dynamic';

import {NextResponse} from 'next/server';
import {readPEMFile, verifySignature} from '@/payment/paybox/crypto';
import {getParamsWithoutSign} from '@/payment/paybox/utils';
import {PAYBOX_ERRORS} from '@/payment/paybox/constant';
import {manager} from '@/tenant';

export async function GET(
  request: Request,
  props: {params: Promise<{tenant: string}>},
) {
  const {tenant: tenantId} = await props.params;

  /* Paybox signs IPNs with its own (global) key, so this endpoint needs no
   * tenant client — just reject IPNs aimed at an unknown tenant path. */
  const tenantIds = await manager.listTenantIds();
  if (!tenantIds.includes(tenantId)) {
    return new NextResponse('Bad Request', {status: 400});
  }

  const parsed = new URL(request.url);
  const params = new URLSearchParams(parsed.search);

  const message = getParamsWithoutSign(parsed.search);

  const pem = readPEMFile();

  const sign = params.get('sign');

  const error = params.get('error');

  if (!(pem && message && sign)) {
    return new NextResponse('Bad Request', {status: 400});
  }

  if (!verifySignature(message, sign, pem)) {
    return new NextResponse('Bad Request', {status: 400});
  }

  if (error !== PAYBOX_ERRORS.CODE_ERROR_OPERATION_SUCCESSFUL) {
    return new NextResponse('Bad Request', {status: 400});
  }

  return new NextResponse('OK', {status: 200});
}
