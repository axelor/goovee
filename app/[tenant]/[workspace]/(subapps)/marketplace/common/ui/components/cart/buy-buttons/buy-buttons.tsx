'use client';

import {Button} from '@/ui/components';
import {ArrowRight, ShoppingCart} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {useRouter} from 'next/navigation';
import {useMarketplaceCart} from '../../../../hooks/use-marketplace-cart';

type Props = {
  productId: string;
  productSlug: string;
  name: string;
  priceAti: number;
  currencySymbol: string | null;
  scale?: number;
  description: string | null;
  iconCode: string | null;
  coverStyle: string | null;
  currentVersionNumber: string | null;
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
  iconCode,
  coverStyle,
  currentVersionNumber,
  cartHref,
  addToCartLabel,
  buyNowLabel,
  inCartLabel,
}: Props) {
  const router = useRouter();
  const {addItem, isInCart, loaded} = useMarketplaceCart();

  if (!loaded) {
    return <div className="h-11 rounded-md bg-ink-50 animate-pulse" />;
  }

  if (isInCart(productId)) {
    return (
      <Button variant="royal" asChild size="lg" className="gap-2">
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
    iconCode,
    coverStyle,
    currentVersionNumber,
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="royal"
        size="lg"
        className="gap-2"
        onClick={() => addItem(item)}>
        <ShoppingCart size={18} />
        {addToCartLabel}
      </Button>
      <Button
        size="lg"
        variant="ink-outline"
        className="gap-2"
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
