import {Button} from '@/ui/components';
import {InnerHTML} from '@/ui/components/inner-html';
import {Trash2} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {MarketplaceCartItem} from '../../../../hooks/use-marketplace-cart';
import {ProductIcon} from '../../shared/product-icon';

type Props = {
  item: MarketplaceCartItem;
  productHref: string;
  /** Locale-aware money formatter, supplied by the caller: renders an amount
   *  at the row's scale with its currency symbol. */
  formatPrice: (
    value: number,
    scale?: number,
    symbol?: string | null,
  ) => string;
  /** Omit to render the row read-only, with no remove button. */
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
    <div className="rounded-lg border border-ink-100 bg-white overflow-hidden flex">
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
              className="font-semibold text-sm text-ink-900 line-clamp-1 hover:underline">
              {item.name}
            </Link>
            {item.currentVersionNumber && (
              <span className="text-xs text-ink-500 shrink-0">
                {item.currentVersionNumber}
              </span>
            )}
          </div>
          {item.description && (
            <InnerHTML
              content={item.description}
              as="p"
              className="text-xs text-ink-500 line-clamp-2"
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
