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
import {clone} from '@/utils';
import {Link} from '@/ui/components/link';
import {notFound} from 'next/navigation';
import {CheckoutContent} from '../../common/ui/components/checkout/checkout-content';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {getMarketplaceConfig} from '../../common/orm/config';

export default async function CheckoutPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
  });
  if (!access.ok) return denyPage(access);

  const config = await getMarketplaceConfig(
    access.workspace.config.id,
    access.tenant.client,
  );
  if (!config) notFound();

  const marketplaceBase = access.url.forRouter(`/${SUBAPP_CODES.marketplace}`);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={marketplaceBase}>{await t('Marketplace')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`${marketplaceBase}/cart`}>{await t('Cart')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{await t('Checkout')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold text-ink-900 mb-6">
        {await t('Checkout')}
      </h1>

      <CheckoutContent config={clone(config)} />
    </div>
  );
}
