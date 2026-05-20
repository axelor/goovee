import Link from 'next/link';
import {XCircle} from 'lucide-react';

import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {Button} from '@/ui/components';

export default async function CheckoutCancelPage(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  const marketplaceBase = `${workspaceURI}/${SUBAPP_CODES.marketplace}`;

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <h1 className="text-2xl font-semibold mb-2">
          {await t('Payment cancelled')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {await t('Your cart is still saved. You can resume any time.')}
        </p>
        <Button asChild>
          <Link href={`${marketplaceBase}/cart`}>
            {await t('Back to cart')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
