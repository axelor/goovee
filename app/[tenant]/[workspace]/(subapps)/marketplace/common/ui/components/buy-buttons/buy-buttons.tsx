'use client';

import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {ShoppingCart, ArrowRight} from 'lucide-react';

import {Button} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

import {useMarketplaceCart} from '../../../hooks/use-marketplace-cart';

type Props = {
  productId: string;
  productSlug: string;
  name: string;
  priceAti: number;
  currencySymbol?: string | null;
  scale?: number;
  description?: string | null;
  marketplaceIconCode?: string | null;
  marketplaceCoverStyle?: string | null;
  currentVersionNumber?: string | null;
  cartHref: string;
  addToCartLabel: string;
  buyNowLabel: string;
  inCartLabel: string;
};

/* Buy / Add-to-cart CTAs for a paid product detail page. Three states:
 *   - not in cart: "Add to cart" + "Buy now"
 *   - in cart: "In cart — view cart"
 * "Buy now" = add + navigate to /cart. The login gate happens earlier;
 * by the time these buttons render, the user is authenticated. */
export function BuyButtons({
  productId,
  productSlug,
  name,
  priceAti,
  currencySymbol,
  scale,
  description,
  marketplaceIconCode,
  marketplaceCoverStyle,
  currentVersionNumber,
  cartHref,
  addToCartLabel,
  buyNowLabel,
  inCartLabel,
}: Props) {
  const router = useRouter();
  const {workspaceURL} = useWorkspace();
  const {addItem, isInCart, loaded} = useMarketplaceCart(workspaceURL);

  if (!loaded) {
    return <div className="h-11 rounded-full bg-muted animate-pulse" />;
  }

  if (isInCart(productId)) {
    return (
      <Button asChild size="lg" className="gap-2 rounded-full">
        <Link href={cartHref}>
          <ShoppingCart size={18} />
          {inCartLabel}
        </Link>
      </Button>
    );
  }

  const item = {
    productId,
    productSlug,
    name,
    priceAti,
    currencySymbol,
    scale,
    description,
    marketplaceIconCode,
    marketplaceCoverStyle,
    currentVersionNumber,
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="gap-2 rounded-full"
        onClick={() => addItem(item)}>
        <ShoppingCart size={18} />
        {addToCartLabel}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="gap-2 rounded-full"
        onClick={async () => {
          await addItem(item);
          router.push(cartHref);
        }}>
        {buyNowLabel}
        <ArrowRight size={18} />
      </Button>
    </div>
  );
}
