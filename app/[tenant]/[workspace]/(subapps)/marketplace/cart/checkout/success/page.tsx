import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {Button} from '@/ui/components';
import {getLoginURL} from '@/utils/url';
import {workspacePathname} from '@/utils/workspace';
import {CheckCircle2, Download} from 'lucide-react';
import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {findPurchases} from '../../../common/orm';
import {ensureAuth} from '../../../common/utils/auth-helper';

/* Success destination after `onApprove` fires in the Payments component.
 * We don't trust query state — just list the buyer's purchases freshly
 * from the DB. The cart was already cleared by `onApprove`. */
export default async function CheckoutSuccessPage(props: {
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
        callbackurl: `${workspaceURI}/${SUBAPP_CODES.marketplace}/my-purchases`,
        workspaceURI,
        tenant: tenantId,
      }),
    );
  }
  if (error) notFound();

  const purchases = await findPurchases({
    client: auth.tenant.client,
    mainPartnerId: auth.user.mainPartnerId,
    take: 10,
  });
  const recent = purchases;

  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;
  const [titleLabel, bodyLabel, downloadLabel, viewAllLabel, unavailableLabel] =
    await Promise.all([
      t('Purchase complete'),
      t(
        'Thanks for your purchase. Your products are now available to download.',
      ),
      t('Download'),
      t('View all my purchases'),
      t('Unavailable'),
    ]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
        <h1 className="text-2xl font-semibold mb-2">{titleLabel}</h1>
        <p className="text-muted-foreground mb-6">{bodyLabel}</p>

        {recent.length > 0 && (
          <ul className="text-left divide-y divide-border rounded border border-border overflow-hidden mb-6">
            {recent.map(row => {
              const product = row.product;
              const version = product?.currentVersion;
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="font-medium">{product?.name}</span>
                  {product?.id && version?.id ? (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`${marketplaceBase}/api/products/${product.id}/versions/${version.id}/download`}>
                        <Download size={14} className="mr-1" />
                        {downloadLabel}
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {unavailableLabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Button asChild>
          <Link href={`${marketplaceBase}/my-purchases`}>{viewAllLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
