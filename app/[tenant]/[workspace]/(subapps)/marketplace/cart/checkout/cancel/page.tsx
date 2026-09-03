import {SUBAPP_CODES} from '@/constants';
import {currentWorkspace} from '@/lib/core/url/current';
import {t} from '@/locale/server';
import {Button} from '@/ui/components';
import {XCircle} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {notFound} from 'next/navigation';

export default async function CheckoutCancelPage() {
  const scope = await currentWorkspace();
  if (!scope) notFound();

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="rounded-lg border border-ink-100 bg-white p-6 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-3 text-ink-500" />
        <h1 className="text-2xl font-semibold mb-2">
          {await t('Payment cancelled')}
        </h1>
        <p className="text-ink-500 mb-6">
          {await t('Your cart is still saved. You can resume any time.')}
        </p>
        <Button variant="royal" asChild>
          <Link href={scope.forRouter(`/${SUBAPP_CODES.marketplace}/cart`)}>
            {await t('Back to cart')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
