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
import {Link} from '@/ui/components/link';
import {getPartnerId} from '@/utils';
import {notFound, redirect} from 'next/navigation';
import {
  canRequestPublisherAccess,
  findPublisherAccess,
} from '../../../common/orm';
import {getMarketplaceConfig} from '../../../common/orm/config';
import {PublisherApplyForm} from '../../../common/ui/components/contributions/publisher-apply-form';
import {canManageProducts} from '../../../common/utils/auth-helper';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {denyPage} from '@/lib/core/access/denial';
import {myContributionsParamsSchema} from '../../../common/utils/validators';

export default async function PublisherApplyPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const paramsResult = myContributionsParamsSchema.safeParse(
    await props.params,
  );
  if (!paramsResult.success) notFound();
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
  });
  if (!access.ok) return denyPage(access);

  const {client} = access.tenant;

  const config = await getMarketplaceConfig(access.workspace.config.id, client);

  if (
    !config?.allowToPublish ||
    !canManageProducts({user: access.user, subapp: access.subapp})
  ) {
    notFound();
  }

  const contributionsHref = access.scope.forRouter(
    `/${SUBAPP_CODES.marketplace}/my-account/contributions`,
  );

  /* Only someone eligible to apply — no request yet, or a declined request
   * whose cooldown has passed — sees the form. An approved, pending, banned or
   * still-cooling partner is sent back to their contributions status. */
  const publisherAccess = await findPublisherAccess({
    client,
    partnerId: getPartnerId(access.user),
    workspaceId: access.workspace.id,
  });
  if (
    publisherAccess.isPublisher ||
    !canRequestPublisherAccess(publisherAccess.request)
  ) {
    redirect(contributionsHref);
  }

  return (
    <div className="min-h-screen container pb-6">
      <div className="mt-6 mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate">
                <Link
                  href={access.scope.forRouter(`/${SUBAPP_CODES.marketplace}`)}>
                  {await t('Marketplace')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-ink-500 cursor-pointer truncate">
                <Link href={contributionsHref}>
                  {await t('My contributions')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {await t('Become a publisher')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="pb-6 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
          {await t('Become a publisher')}
        </h1>
        <p className="text-ink-500 text-sm">
          {await t(
            'Tell us what you plan to publish and an admin will review your request.',
          )}
        </p>
      </div>

      <PublisherApplyForm contributionsHref={contributionsHref} />
    </div>
  );
}
