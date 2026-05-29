import {Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {Trash2} from 'lucide-react';
import Link from 'next/link';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {MarketplaceCartItem} from '../../../../hooks/use-marketplace-cart';
import {ProductIcon} from '../../primitives/product-icon';

type Props = {
  item: MarketplaceCartItem;
  productHref: string;
  /** Localised currency-aware formatter shared by all callers. */
  formatPrice: (
    value: number,
    scale?: number,
    symbol?: string | null,
  ) => string;
  /** Pass a handler to render the remove button (cart page). Omit for
   *  read-only contexts like the checkout review. */
  onRemove?: (productId: string) => void;
  removeLabel?: string;
};

export function CartItemCard({
  item,
  productHref,
  formatPrice,
  onRemove,
  removeLabel,
}: Props) {
  const bgGradient =
    GRADIENT_MAP[item.coverStyle || 'gradient-1'] || DEFAULT_GRADIENT;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex">
      <Link
        href={productHref}
        className={`shrink-0 w-24 sm:w-32 min-h-[96px] bg-gradient-to-br ${bgGradient} flex items-center justify-center self-stretch`}>
        <ProductIcon
          code={item.iconCode}
          className="w-10 h-10 sm:w-12 sm:h-12"
        />
      </Link>
      <div className="flex-1 flex items-start justify-between gap-4 p-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={productHref}
              className="font-semibold text-sm text-foreground line-clamp-1 hover:underline">
              {item.name}
            </Link>
            {item.currentVersionNumber && (
              <span className="text-xs text-muted-foreground shrink-0">
                {item.currentVersionNumber}
              </span>
            )}
          </div>
          {item.description && (
            <InnerHTML
              content={item.description}
              as="p"
              className="text-xs text-muted-foreground line-clamp-2"
            />
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-semibold">
            {formatPrice(item.priceAti, item.scale, item.currencySymbol)}
          </span>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.productId)}
              aria-label={removeLabel}>
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
