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
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {DEFAULT_MARKETPLACE_TYPE_SEGMENT} from '../common/constants/route-types';
import {CartContent} from '../common/ui/components/cart-content';
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

  const [
    cartLabel,
    yourCartLabel,
    emptyLabel,
    browseLabel,
    subtotalLabel,
    proceedLabel,
    removeLabel,
  ] = await Promise.all([
    t('Cart'),
    t('Your cart'),
    t('Your cart is empty.'),
    t('Browse marketplace'),
    t('Subtotal'),
    t('Proceed to checkout'),
    t('Remove'),
  ]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href={`${marketplaceBase}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`}>
                {await t('Marketplace')}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{cartLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {yourCartLabel}
      </h1>

      <CartContent
        marketplaceBase={marketplaceBase}
        emptyLabel={emptyLabel}
        browseLabel={browseLabel}
        subtotalLabel={subtotalLabel}
        proceedLabel={proceedLabel}
        removeLabel={removeLabel}
        browseHref={`${marketplaceBase}/${DEFAULT_MARKETPLACE_TYPE_SEGMENT}`}
        checkoutHref={`${marketplaceBase}/cart/checkout`}
      />
    </div>
  );
}
