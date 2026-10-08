import {NextResponse, after} from 'next/server';
import {headers} from 'next/headers';

import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import {setPaymentCookie} from '@/payment/access';
import {GatewaySchema, getAdapter} from '@/payment/adapters/registry';
import {parseReference} from '@/payment/domain/reference';
import type {GatewaySignal} from '@/payment/domain/signal';
import {runPaymentTasks} from '@/payment/tasks';
import {triggerRegistration} from '@/payment/register';
import {referenceOf, resolveReference} from '@/payment/resolve';
import {settlePayment} from '@/payment/settle';
import {paymentPageUrl} from '@/payment/urls';

/*
 * Where every gateway sends the browser back. Verifies the return through the
 * adapter, settles when the gateway's browser leg may, gives the browser a
 * cookie scoped to the payment, and sends it on to the result page. The page
 * itself is a pure read, so it is safe to refresh and to share.
 *
 * Nothing here decides anything: the adapter turns the return into a
 * provider-attested signal, and the same settle the webhook calls records it.
 *
 * The cookie is granted only on the strength of that signal. A return that
 * cannot be read still sends the browser to the page named by the address,
 * but without a cookie, so the page opens only for the signed-in payer: the
 * reference in the address identifies the payment and grants nothing.
 */
async function handleReturn(
  request: Request,
  props: {params: Promise<{gateway: string}>},
): Promise<NextResponse> {
  const {gateway: gatewayParam} = await props.params;
  const tenantId = (await headers()).get(TENANT_HEADER);
  const tenant = tenantId ? await manager.getTenant(tenantId) : null;
  const gateway = GatewaySchema.safeParse(gatewayParam);
  if (!tenant || !gateway.success) {
    return new NextResponse('Not Found', {status: 404});
  }

  const adapter = getAdapter(gateway.data);
  const context = {tenantId: tenant.id, config: tenant.config};

  const url = new URL(request.url);
  const referenceFromAddress =
    parseReference(url.searchParams.get('ref'))?.reference ?? null;

  let signal: GatewaySignal | null = null;
  try {
    signal = await adapter.parseReturn(request, context);
  } catch (error) {
    console.warn(
      `${gateway.data} return could not be read for tenant ${tenant.id}:`,
      error,
    );
  }

  /* The reference the provider attested to, through the signal. */
  let attestedReference: string | null = null;

  if (signal) {
    if (adapter.capabilities.settlesOnReturn) {
      const outcome = await settlePayment({signal, tenant});
      if (
        outcome.outcome === 'settled' ||
        outcome.outcome === 'duplicate' ||
        outcome.outcome === 'pending'
      ) {
        attestedReference = outcome.reference;
      }
      /* Awaited, with a short timeout, so the page usually reads complete on
       * first paint. The task row is committed either way. */
      if (outcome.outcome === 'settled' && outcome.registrationQueued) {
        await triggerRegistration({tenant, reference: outcome.reference});
      }
      /* Not awaited: it changes nothing the page shows, and the task row is
       * committed, so the clock runs it if this does not. */
      if (outcome.outcome === 'settled' && outcome.gooveeTasksQueued) {
        const {paymentId} = outcome;
        after(() => runPaymentTasks({tenant, paymentId}));
      }
    } else {
      attestedReference = await referenceOf({
        resolution: signal.resolution,
        gateway: gateway.data,
        tenantId: tenant.id,
        client: tenant.client,
      });
    }
  }

  const reference = attestedReference ?? referenceFromAddress;
  if (!reference) {
    return new NextResponse('Not Found', {status: 404});
  }

  const resolved = await resolveReference({
    reference,
    tenantId: tenant.id,
    client: tenant.client,
  });
  if (resolved.kind !== 'found') {
    return new NextResponse('Not Found', {status: 404});
  }
  const payment = await tenant.client.aOSPortalPayment.findOne({
    where: {id: resolved.paymentId},
    select: {portalWorkspace: {url: true}},
  });
  if (!payment?.portalWorkspace.url) {
    return new NextResponse('Not Found', {status: 404});
  }

  const response = NextResponse.redirect(
    paymentPageUrl(tenant.id, payment.portalWorkspace.url, reference),
    303,
  );
  if (attestedReference) {
    setPaymentCookie(response.cookies, tenant, attestedReference);
  }
  return response;
}

export const GET = handleReturn;
export const POST = handleReturn;
