import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {CheckCircle2, Download} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {
  DEFAULT_GRADIENT,
  GRADIENT_MAP,
} from '../../../common/constants/gradients';
import {findPurchases} from '../../../common/orm';
import {ProductIcon} from '../../../common/ui/components/shared/product-icon';
import {ensureAuth} from '../../../common/utils/auth-helper';
import {checkoutSuccessSearchParamsSchema} from '../../../common/utils/validators';

/* Success destination after `onApprove` fires in the Payments component.
 * `onApprove` passes the purchase-row ids from this checkout via repeated
 * `id` query params; we re-read those rows (partner-scoped, so a
 * tampered id can't surface someone else's purchase) and show only them.
 * Reaching this page without ids means there's nothing to confirm. */
export default async function CheckoutSuccessPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{id?: string | string[]}>;
}) {
  const params = await props.params;
  const {id: purchaseIds} = checkoutSuccessSearchParamsSchema.parse(
    await props.searchParams,
  );
  if (purchaseIds.length === 0) notFound();
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
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-account/purchases`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const recent = await findPurchases({
    client: auth.tenant.client,
    workspaceId: auth.workspace.id,
    mainPartnerId: auth.user.mainPartnerId,
    purchaseIds,
  });

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
        <h1 className="text-2xl font-semibold mb-2">
          {await t('Purchase complete')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {await t(
            'Thanks for your purchase. Your products are now available to download.',
          )}
        </p>

        {recent.length > 0 && (
          <ul className="text-left divide-y divide-border rounded border border-border overflow-hidden mb-6">
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
                      <div className="font-medium text-foreground truncate">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          <InnerHTML content={product.description} />
                        </div>
                      )}
                    </div>
                  </div>
                  {version?.id ? (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`${marketplaceBase}/api/products/${product.id}/versions/${version.id}/download`}>
                        <Download size={14} className="mr-1" />
                        {t('Download')}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {t('Unavailable')}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Button asChild>
          <Link href={`${marketplaceBase}/my-account/purchases`}>
            {await t('View all my purchases')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
