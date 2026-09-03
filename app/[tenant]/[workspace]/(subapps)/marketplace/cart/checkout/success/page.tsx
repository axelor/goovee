import {SEARCH_PARAMS, SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {getLoginURL} from '@/utils/login-url';
import {getPartnerId} from '@/utils';
import {currentWorkspace} from '@/lib/core/url/current';
import {CheckCircle2, Download} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound, redirect, unauthorized} from 'next/navigation';
import {
  DEFAULT_GRADIENT,
  GRADIENT_MAP,
} from '../../../common/constants/gradients';
import {findPurchases} from '../../../common/orm';
import {ProductIcon} from '../../../common/ui/components/shared/product-icon';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {checkoutSuccessSearchParamsSchema} from '../../../common/utils/validators';

/* Reached after payment with the new order's id in `?orderId=`. The order is
 * re-read partner-scoped, so a tampered id cannot surface someone else's
 * order. A successful payment can still arrive with no id — the redirect omits
 * the param when the action returns none — and that 404s. */
export default async function CheckoutSuccessPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{orderId?: string}>;
}) {
  const rawSearchParams = await props.searchParams;

  const searchParamsResult =
    checkoutSuccessSearchParamsSchema.safeParse(rawSearchParams);
  if (!searchParamsResult.success) notFound();
  const {orderId} = searchParamsResult.data;
  if (!orderId) notFound();
  const access = await ensureAccess({
    code: SUBAPP_CODES.marketplace,
  });
  if (!access.ok) {
    if (
      access.reason === 'workspace-not-found' ||
      access.reason === 'app-not-installed'
    ) {
      notFound();
    }
    /* Not `denyPage`: a visitor who signs in from here is sent on to their
     * purchases rather than back to a success page whose order is already
     * recorded. */
    if (!access.user) {
      const scope = await currentWorkspace();

      redirect(
        getLoginURL({
          callbackurl: scope?.forRouter(
            `/${SUBAPP_CODES.marketplace}/my-account/purchases`,
          ),
          workspaceURI: scope?.forRouter(),
          [SEARCH_PARAMS.TENANT_ID]: scope?.tenantId,
        }),
      );
    }
    unauthorized();
  }

  const recent = await findPurchases({
    client: access.tenant.client,
    workspaceId: access.workspace.id,
    mainPartnerId: getPartnerId(access.user),
    orderId,
  });

  const marketplaceBase = access.url.forRouter(`/${SUBAPP_CODES.marketplace}`);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-lg border border-ink-100 bg-white p-6 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-mint-600" />
        <h1 className="text-2xl font-semibold mb-2">
          {await t('Purchase complete')}
        </h1>
        <p className="text-ink-500 mb-6">
          {await t(
            'Thanks for your purchase. Your products are now available to download.',
          )}
        </p>

        {recent.length > 0 && (
          <ul className="text-left divide-y divide-ink-100 rounded border border-ink-100 overflow-hidden mb-6">
            {recent.map(row => {
              const product = row.marketplaceProduct;
              const version = product.currentVersion;
              const bgGradient =
                GRADIENT_MAP[product.coverStyle || 'gradient-1'] ||
                DEFAULT_GRADIENT;
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br',
                        bgGradient,
                      )}>
                      <ProductIcon
                        code={product.iconCode}
                        className="w-6 h-6"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-ink-900 truncate">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-ink-500 line-clamp-2">
                          <InnerHTML content={product.description} />
                        </div>
                      )}
                    </div>
                  </div>
                  {version?.id ? (
                    <Button asChild variant="ink-outline" size="sm">
                      <a
                        href={access.url.forBrowser(
                          `/${SUBAPP_CODES.marketplace}/api/products/${product.id}/versions/${version.id}/download`,
                        )}>
                        <Download size={14} className="mr-1" />
                        {t('Download')}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-ink-500 text-xs">
                      {t('Unavailable')}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Button variant="royal" asChild>
          <Link href={`${marketplaceBase}/my-account/purchases`}>
            {await t('View all my purchases')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
