import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import {notFound} from 'next/navigation';
import {CartContent} from '../common/ui/components/cart/cart-content';
import {ensureAuth} from '../common/utils/auth-helper';

export default async function CartPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error} = await ensureAuth(workspaceURL, tenantId, {allowGuest: true});
  if (error) notFound();

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={marketplaceBase}>{await t('Marketplace')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{await t('Cart')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {await t('Your cart')}
      </h1>

      <CartContent
        marketplaceBase={marketplaceBase}
        emptyLabel={await t('Your cart is empty.')}
        browseLabel={await t('Browse marketplace')}
        subtotalLabel={await t('Subtotal')}
        proceedLabel={await t('Proceed to checkout')}
        removeLabel={await t('Remove')}
        browseHref={marketplaceBase}
        checkoutHref={`${marketplaceBase}/cart/checkout`}
      />
    </div>
  );
}
