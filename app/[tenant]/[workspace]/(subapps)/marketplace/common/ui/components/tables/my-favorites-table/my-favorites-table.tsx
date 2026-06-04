'use client';

import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {formatNumber} from '@/locale/formatters';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components';
import {Collapsible, CollapsibleContent} from '@/ui/components/collapsible';
import {InnerHTML} from '@/ui/components/inner-html';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/table';
import {useResponsive} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {ChevronDown, ChevronUp, ExternalLink} from 'lucide-react';
import Link from 'next/link';
import {Fragment, useState, type ReactNode} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {ListFavoriteProduct} from '../../../../orm';
import {AddToFavoriteButton} from '../../buttons/add-to-favorite-button';
import {ProductIcon} from '../../primitives/product-icon';
import {ProductTypeBadge} from '../../primitives/product-type-badge';
import {Rating} from '../../primitives/rating';

type Favorite = Cloned<ListFavoriteProduct>;

type Column = {
  key: string;
  label: string;
  mobile?: boolean;
  /** Extra Tailwind classes applied to the cell on desktop only. */
  desktopClassName?: string;
  content: (favorite: Favorite) => ReactNode;
};

type Props = {
  favorites: Favorite[];
  workspaceURI: string;
  workspaceURL: string;
  marketplaceBase: string;
  /** A search/type/price filter is active — changes the empty state to
   *  "no results" instead of the "nothing saved yet" call to action. */
  filtered?: boolean;
};

export function MyFavoritesTable({
  favorites,
  workspaceURI,
  workspaceURL,
  marketplaceBase,
  filtered = false,
}: Props) {
  const responsive = useResponsive();
  const small = RESPONSIVE_SIZES.some(size => responsive[size]);
  const [openId, setOpenId] = useState<string | null>(null);

  const columns: Column[] = [
    {
      key: 'name',
      label: i18n.t('Name'),
      mobile: true,
      desktopClassName: 'w-[46%] min-w-[220px]',
      content: favorite => {
        const bgGradient =
          GRADIENT_MAP[favorite.coverStyle || 'gradient-1'] || DEFAULT_GRADIENT;
        return (
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br',
                bgGradient,
              )}>
              <ProductIcon code={favorite.iconCode} className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {favorite.name}
                </div>
                {favorite.marketplaceTypeSelect && (
                  <ProductTypeBadge
                    type={favorite.marketplaceTypeSelect}
                    label={i18n.tattr(favorite.marketplaceTypeSelect)}
                    className="flex-shrink-0"
                  />
                )}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                <InnerHTML content={favorite.description ?? undefined} />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'price',
      label: i18n.t('Price'),
      desktopClassName: 'w-[18%]',
      content: favorite => {
        const {ati, currency} = favorite.price;
        const paid = Number(ati) > 0;
        return (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
              paid
                ? 'bg-primary/10 text-primary'
                : 'bg-success-light text-success',
            )}>
            {paid
              ? formatNumber(ati, {
                  type: 'DECIMAL',
                  scale: currency.numberOfDecimals,
                  currency: currency.code,
                })
              : i18n.t('Free')}
          </span>
        );
      },
    },
    {
      key: 'rating',
      label: i18n.t('Rating'),
      desktopClassName: 'w-[18%]',
      content: favorite => <Rating value={favorite.averageRating} />,
    },
    {
      key: 'installs',
      label: i18n.t('Installs'),
      desktopClassName: 'w-[18%]',
      content: favorite => (
        <span className="text-sm">{favorite.installCount ?? 0}</span>
      ),
    },
  ];

  const mainColumns = small ? columns.filter(c => c.mobile) : columns;
  const subColumns = small ? columns.filter(c => !c.mobile) : [];

  if (favorites.length === 0) {
    /* No matches for active filters reads differently from an empty list. */
    if (filtered) {
      return (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {i18n.t('No products match your filters.')}
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground mb-4">
          {i18n.t("You haven't saved any products yet.")}
        </p>
        <Button asChild>
          <Link href={marketplaceBase}>{i18n.t('Browse marketplace')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Table
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground',
        small && 'table-fixed',
      )}>
      <TableHeader>
        <TableRow className="bg-gray-fog hover:bg-gray-fog">
          {mainColumns.map(c => (
            <TableHead
              key={c.key}
              className={cn(
                'uppercase text-xs tracking-wider',
                !small && c.desktopClassName,
              )}>
              {c.label}
            </TableHead>
          ))}
          {small && subColumns.length > 0 && <TableHead className="w-12" />}
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {favorites.map(favorite => {
          const open = openId === favorite.id;
          const Arrow = open ? ChevronUp : ChevronDown;
          return (
            <Fragment key={favorite.id}>
              <TableRow>
                {mainColumns.map(c => (
                  <TableCell
                    key={c.key}
                    className={cn('p-3', !small && c.desktopClassName)}>
                    {c.content(favorite)}
                  </TableCell>
                ))}
                {small && subColumns.length > 0 && (
                  <TableCell className="p-3 w-10">
                    <button
                      type="button"
                      aria-label={open ? 'Collapse' : 'Expand'}
                      onClick={() => setOpenId(open ? null : favorite.id)}
                      className="p-1 rounded-full hover:bg-muted transition-colors">
                      <Arrow className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TableCell>
                )}
                <TableCell className="p-3">
                  <div className="flex justify-end items-center gap-1">
                    <Link
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${favorite.slug}`}
                      title={i18n.t('View live')}
                      className="p-1.5 rounded-full hover:bg-muted transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                    {/* Same toggle as the product header — toggles the heart
                        optimistically; the row stays so it can be re-added. */}
                    <AddToFavoriteButton
                      productId={favorite.id}
                      workspaceURL={workspaceURL}
                      workspaceURI={workspaceURI}
                      isFavorite
                      variant="bare"
                    />
                  </div>
                </TableCell>
              </TableRow>
              {small && subColumns.length > 0 && (
                <Collapsible open={open} asChild>
                  <TableRow className="bg-muted/30">
                    <CollapsibleContent asChild>
                      <TableCell colSpan={mainColumns.length + 2}>
                        <div className="grid grid-cols-2 gap-y-2 items-center px-2 py-1">
                          {subColumns.map(c => (
                            <Fragment key={c.key}>
                              <div className="text-xs font-semibold uppercase text-muted-foreground">
                                {c.label}
                              </div>
                              <div className="flex justify-self-end items-center">
                                {c.content(favorite)}
                              </div>
                            </Fragment>
                          ))}
                        </div>
                      </TableCell>
                    </CollapsibleContent>
                  </TableRow>
                </Collapsible>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
