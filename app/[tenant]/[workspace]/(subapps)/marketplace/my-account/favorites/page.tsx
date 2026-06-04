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
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {Heart} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {NoticeBanner} from '../../common/ui/components/primitives/notice-banner';
import {ensureAuth} from '../../common/utils/auth-helper';
import {myAccountParamsSchema} from '../../common/utils/validators';

export default async function FavoritesPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const rawParams = await props.params;

  const paramsResult = myAccountParamsSchema.safeParse(rawParams);
  if (!paramsResult.success) notFound();
  const params = paramsResult.data;

  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);

  const {error, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/favorites`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  const [
    marketplaceLabel,
    myAccountLabel,
    favoritesLabel,
    favoritesDescLabel,
    comingSoonTitle,
    comingSoonDescription,
  ] = await Promise.all([
    t('Marketplace'),
    t('My account'),
    t('Favorites'),
    t('Your saved products.'),
    t('Coming soon'),
    t('Your favourite products will appear here.'),
  ]);

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb */}
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={marketplaceBase}>{marketplaceLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${marketplaceBase}/my-account`}>
                  {myAccountLabel}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {favoritesLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="pb-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {favoritesLabel}
          </h1>
          <p className="text-muted-foreground text-sm">{favoritesDescLabel}</p>
        </div>
      </div>

      <NoticeBanner
        icon={Heart}
        title={comingSoonTitle}
        description={comingSoonDescription}
      />
    </div>
  );
}
