import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components/breadcrumb';
import {Button} from '@/ui/components';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Store,
  type LucideIcon,
} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound, redirect} from 'next/navigation';
import {canManageProducts, ensureAuth} from '../common/utils/auth-helper';
import {myAccountParamsSchema} from '../common/utils/validators';

export default async function MyAccountPage(props: {
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

  const {error, auth, forceLogin} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (forceLogin) {
    redirect(
      getLoginURL({
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const isSeller =
    auth.workspace.config.allowToPublish === true && canManageProducts(auth);
  const accountBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account`;

  const cards: Array<{
    href: string;
    icon: LucideIcon;
    title: string;
    description: string;
  }> = [
    {
      href: `${accountBase}/purchases`,
      icon: ShoppingBag,
      title: await t('My purchases'),
      description: await t('Review the apps you have purchased.'),
    },
    {
      href: `${accountBase}/favorites`,
      icon: Heart,
      title: await t('Favorites'),
      description: await t('Your saved products.'),
    },
    ...(isSeller
      ? [
          {
            href: `${accountBase}/contributions`,
            icon: Store,
            title: await t('My contributions'),
            description: await t('Manage your published products.'),
          },
        ]
      : []),
  ];

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
                <Link href={`${workspaceURI}/${SUBAPP_CODES.marketplace}`}>
                  {await t('Marketplace')}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="sm:truncate text-lg font-semibold">
                {await t('My account')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {await t('My account')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {await t(
                'Manage your purchases and, if you sell, your published products.',
              )}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link
              href={`${workspaceURI}/${SUBAPP_CODES.directory}/entry/${auth.user.mainPartnerId}`}>
              {await t('See partner profile')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-lg border border-border bg-card p-6 flex items-start gap-4 transition-colors hover:border-primary">
            <div className="rounded-md bg-muted p-3">
              <card.icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {card.title}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
