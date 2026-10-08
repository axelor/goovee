import {notFound} from 'next/navigation';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {ensureAccess} from '@/access/ensure-access';
import {denyPage} from '@/access/denial';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {findSubappAccess} from '@/orm/workspace';
import {IdSchema} from '@/utils/validators';

// ---- LOCAL IMPORTS ---- //
import {findOrderRequest} from '@/subapps/shop/common/orm/order-request';
import {OrderConfirmation} from '@/subapps/shop/common/ui/components/order-confirmation';

const SearchParamsSchema = z.object({
  request: IdSchema,
});

/* Reached from the payment page once the order is paid, with the order request
 * the capture recorded. The sale order is read off the request rather than
 * carried in the URL, so the link appears as soon as the ERP has registered the
 * payment, whether that was before the buyer got here or after. */
export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{request?: string}>;
}) {
  const parsed = SearchParamsSchema.safeParse(await props.searchParams);
  if (!parsed.success) notFound();

  const access = await ensureAccess({
    code: SUBAPP_CODES.shop,
    allowGuest: false,
  });
  if (!access.ok) return denyPage(access);

  const {user, workspace} = access;
  const {client} = access.tenant;

  const request = await findOrderRequest({
    id: parsed.data.request,
    partnerId:
      user.isContact && user.mainPartnerId ? user.mainPartnerId : user.id,
    workspaceId: workspace.id,
    client,
  });
  if (!request) notFound();

  const ordersSubapp = request.saleOrder
    ? await findSubappAccess({
        code: SUBAPP_CODES.orders,
        user,
        url: workspace.url,
        client,
      })
    : null;

  const orderHref =
    ordersSubapp && request.saleOrder
      ? access.scope.forRouter(
          `/${SUBAPP_CODES.orders}/${request.saleOrder.id}`,
        )
      : null;

  return (
    <OrderConfirmation
      orderRequestId={parsed.data.request}
      heading={await t('Order confirmed')}
      body={await t('Thank you for your order. It has been recorded.')}
      orderHref={orderHref}
      orderLabel={await t('View my order')}
      shopHref={access.scope.forRouter(`/${SUBAPP_CODES.shop}`)}
      shopLabel={await t('Back to shop')}
    />
  );
}
