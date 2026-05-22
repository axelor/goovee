import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';

import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {getLoginURL} from '@/utils/url';
import {clone} from '@/utils';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';

import {ensureAuth} from '../../common/utils/auth-helper';
import {CheckoutClient} from '../../common/ui/components/checkout-client';
import {DEFAULT_MARKETPLACE_TYPE_SEGMENT} from '../../common/constants/route-types';

export default async function CheckoutPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/cart/checkout`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
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

      <CheckoutClient workspace={clone(auth.workspace)} />
    </div>
  );
}
