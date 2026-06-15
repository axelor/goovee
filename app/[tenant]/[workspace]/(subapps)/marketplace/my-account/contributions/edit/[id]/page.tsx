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
import {getTotal} from '@/utils/pagination';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {MARKETPLACE_TYPE} from '../../../../common/constants/marketplace-types';
import {
  findMyProductForEdit,
  findMyProductVersions,
} from '../../../../common/orm';
import {ProductEditPage} from '../../../../common/ui/components/product/product-edit/product-edit-page';
import {VERSIONS_PAGE_SIZE} from '../../../../common/ui/components/versions/version-form/validator';
import {loadEditContext} from '../load-edit-context';

/**
 * Full-page editor reached by id (deep-link / redirect), or by the literal
 * `new` for create (`?type=app|skill` fixes the kind). Product and versions are
 * edited together and saved once; the dialog remains the quick in-app path.
 * Save / cancel returns to the contributions products tab.
 */
export default async function EditProductPage(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
  searchParams: Promise<{type?: string}>;
}) {
  const {tenant, workspace, id} = await props.params;
  const {type} = await props.searchParams;
  const ctx = await loadEditContext({tenant, workspace});

  const returnHref = `${ctx.workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/contributions?tab=products`;
  const base = `${ctx.workspaceURI}/${SUBAPP_CODES.marketplace}`;

  const isNew = id === 'new';
  const defaultType =
    type?.toLowerCase() === 'app'
      ? MARKETPLACE_TYPE.APP
      : MARKETPLACE_TYPE.SKILL;

  const loaded = isNew
    ? null
    : await Promise.all([
        findMyProductForEdit({
          productId: id,
          mainPartnerId: ctx.auth.user.mainPartnerId,
          client: ctx.auth.tenant.client,
          workspace: ctx.auth.workspace,
        }),
        findMyProductVersions({
          productId: id,
          mainPartnerId: ctx.auth.user.mainPartnerId,
          client: ctx.auth.tenant.client,
          workspace: ctx.auth.workspace,
          skip: 0,
          take: VERSIONS_PAGE_SIZE,
        }),
      ]);
  const product = loaded?.[0] ?? null;
  const firstPage = loaded?.[1] ?? null;
  /* Unknown / not-owned id → back to the listing rather than 404 a stale link. */
  if (!isNew && !product) redirect(returnHref);
  const cloned = product ? clone(product) : undefined;

  const leafLabel = isNew
    ? defaultType === MARKETPLACE_TYPE.APP
      ? await t('Publish a new app')
      : await t('Publish a new skill')
    : (cloned?.name ?? '');

  return (
    <div className="min-h-screen container pb-6">
      {/* Breadcrumb — "My contributions" links back to the products tab; the
          product name is the leaf. */}
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={base}>{await t('Marketplace')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${base}/my-account`}>{await t('My account')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-foreground-muted cursor-pointer truncate text-md">
                <Link href={`${base}/my-account/contributions?tab=products`}>
                  {await t('My contributions')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {leafLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ProductEditPage
        initial={cloned}
        defaultType={isNew ? defaultType : undefined}
        initialVersions={firstPage ? clone(firstPage) : []}
        initialTotal={firstPage ? getTotal(firstPage) : 0}
        categories={clone(ctx.categories)}
        licenses={clone(ctx.licenses)}
        compatibilityVersions={clone(ctx.compatibilityVersions)}
        listingCurrency={cloned?.saleCurrency ?? clone(ctx.newListingCurrency)}
        inAti={cloned?.inAti ?? ctx.inAti}
        requiresReview={ctx.requiresReview}
        allowToPublish={ctx.allowToPublish}
        workspaceURI={ctx.workspaceURI}
        workspaceURL={ctx.workspaceURL}
        returnHref={returnHref}
      />
    </div>
  );
}
