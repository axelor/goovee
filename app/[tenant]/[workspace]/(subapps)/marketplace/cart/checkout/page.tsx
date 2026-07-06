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
import {getLoginURL} from '@/utils/url';
import {getCurrentPath} from '@/utils/current-path';
import {workspacePathname} from '@/utils/workspace';
import {Link} from '@/ui/components/link';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {CheckoutContent} from '../../common/ui/components/checkout/checkout-content';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {getMarketplaceConfig} from '../../common/orm/config';

export default async function CheckoutPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
    url: workspaceURL,
    tenantId,
  });
  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    if (!access.user) {
      redirect(
        getLoginURL({
          callbackurl: await getCurrentPath(),
          workspaceURI,
          tenant: tenantId,
        }),
      );
    }
    unauthorized();
  }

  const config = await getMarketplaceConfig(
    access.workspace.config.id,
    access.tenant.client,
  );
  if (!config) notFound();

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

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

      <h1 className="text-2xl font-semibold text-foreground mb-6">
        {await t('Checkout')}
      </h1>

      <CheckoutContent config={clone(config)} />
    </div>
  );
}
