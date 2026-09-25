import {notFound} from 'next/navigation';
import {cookies} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {manager} from '@/tenant';
import {currentTenantScope, currentWorkspace} from '@/url/current';
import {canViewPayment} from '@/payment/access';
import {parseReference} from '@/payment/domain/reference';
import {findAwaitingInstructions, findPaymentView} from '@/payment/view';

// ---- LOCAL IMPORTS ---- //
import {PaymentResult} from './payment-result';

/*
 * The one place a payment's result is shown, for every source and every
 * gateway. Server-rendered from the ledger, so it survives a refresh, a closed
 * tab and a forwarded link; the client part only polls while something can
 * still change. Nothing here mutates.
 */
export default async function Page(props: {
  params: Promise<{reference: string}>;
}) {
  const [{reference: referenceParam}, scope, tenantScope] = await Promise.all([
    props.params,
    currentWorkspace(),
    currentTenantScope(),
  ]);
  if (!scope) notFound();

  const parsed = parseReference(referenceParam);
  if (!parsed || parsed.tenantId !== scope.tenantId) notFound();

  const tenant = await manager.getTenant(scope.tenantId);
  if (!tenant) notFound();

  const view = await findPaymentView(tenant, parsed.reference);
  /* A payment made under another workspace is not shown under this one. */
  if (!view || view.workspaceUrl !== scope.key()) notFound();

  const [cookieStore, session] = await Promise.all([cookies(), getSession()]);
  const allowed = canViewPayment({
    cookies: cookieStore,
    tenant,
    reference: view.reference,
    payer: view.payer,
    userEmail: session?.user?.email,
  });
  if (!allowed) notFound();

  const instructions = await findAwaitingInstructions(tenant, view);

  return (
    <div className="bg-ink-25 min-h-full">
      <PaymentResult
        initial={{...view, instructions}}
        statusPath={tenantScope.forBrowser(
          `/api/payments/${view.reference}/status`,
        )}
      />
    </div>
  );
}
