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

/* Buy / Add-to-cart CTAs for a paid product. The stored cart lives in
 * IndexedDB, so it is never loaded on first paint; a skeleton stands in until
 * it is, rather than letting the control flip from add to in-cart under the
 * user. After that it is either the add + buy pair or a single link to
 * `cartHref`, and buy adds then follows that link. Every label is supplied by
 * the caller. The login gate happens earlier, so by the time these render the
 * user is authenticated. */
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
