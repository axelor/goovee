'use client';

import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
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
import {
  ChevronDown,
  ChevronUp,
  Download as DownloadIcon,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {Fragment, useState, type ReactNode} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import type {MarketplacePurchase} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {ProductIcon} from '../../shared/product-icon';

type Purchase = Cloned<MarketplacePurchase>;

type Column = {
  key: string;
  label: string;
  mobile?: boolean;
  desktopClassName?: string;
  content: (p: Purchase, ctx: {dateFormat: Intl.DateTimeFormat}) => ReactNode;
};

type Props = {
  purchases: Purchase[];
  workspaceURI: string;
};

export function MyPurchasesTable({purchases, workspaceURI}: Props) {
  const responsive = useResponsive();
  const small = RESPONSIVE_SIZES.some(size => responsive[size]);
  const [openId, setOpenId] = useState<string | null>(null);

  const dateFormat = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const columns: Column[] = [
    {
      key: 'product',
      label: i18n.t('Product'),
      mobile: true,
      desktopClassName: 'w-[45%] min-w-[220px]',
      content: purchase => {
        const product = purchase.marketplaceProduct;
        if (!product) return '—';
        const bgGradient =
          GRADIENT_MAP[product.coverStyle || 'gradient-1'] || DEFAULT_GRADIENT;
        return (
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br',
                bgGradient,
              )}>
              <ProductIcon code={product.iconCode} className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              {product.slug ? (
                <Link
                  href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`}
                  className="font-medium text-foreground truncate hover:underline">
                  {product.name}
                </Link>
              ) : (
                <div className="font-medium text-foreground truncate">
                  {product.name}
                </div>
              )}
              {product.description && (
                <div className="text-xs text-muted-foreground line-clamp-2">
                  <InnerHTML content={product.description} />
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'version',
      label: i18n.t('Current version'),
      desktopClassName: 'w-[18%]',
      content: purchase => (
        <span className="text-sm whitespace-nowrap">
          {purchase.marketplaceProduct.currentVersion
            ? `v${formatVersionNumber(purchase.marketplaceProduct.currentVersion)}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'purchaseDateTime',
      label: i18n.t('Purchased on'),
      desktopClassName: 'w-[20%]',
      content: (purchase, {dateFormat}) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {purchase.purchaseDateTime
            ? dateFormat.format(new Date(purchase.purchaseDateTime))
            : '—'}
        </span>
      ),
    },
    {
      key: 'order',
      label: i18n.t('Order'),
      desktopClassName: 'w-[15%]',
      content: purchase =>
        purchase.saleOrder?.id ? (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.orders}/${purchase.saleOrder.id}`}
            className="text-sm text-primary hover:underline">
            {purchase.saleOrder.saleOrderSeq ?? i18n.t('View')}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'invoice',
      label: i18n.t('Invoice'),
      desktopClassName: 'w-[15%]',
      content: purchase =>
        purchase.invoice?.id ? (
          <Link
            href={`${workspaceURI}/${SUBAPP_CODES.invoices}/${purchase.invoice.id}`}
            className="text-sm text-primary hover:underline">
            {purchase.invoice.invoiceId ?? i18n.t('View')}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
  ];

  const mainColumns = small ? columns.filter(c => c.mobile) : columns;
  const subColumns = small ? columns.filter(c => !c.mobile) : [];

  if (purchases.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border px-6 py-12 text-center">
        <div className="text-sm text-muted-foreground">
          {i18n.t("You haven't purchased anything yet.")}
        </div>
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
        {purchases.map(purchase => {
          const open = openId === purchase.id;
          const Arrow = open ? ChevronUp : ChevronDown;
          const product = purchase.marketplaceProduct;
          const version = product?.currentVersion;
          const canDownload = product?.id && version?.id;
          return (
            <Fragment key={purchase.id}>
              <TableRow>
                {mainColumns.map(c => (
                  <TableCell
                    key={c.key}
                    className={cn('p-3', !small && c.desktopClassName)}>
                    {c.content(purchase, {dateFormat})}
                  </TableCell>
                ))}
                {small && subColumns.length > 0 && (
                  <TableCell className="p-3 w-10">
                    <button
                      type="button"
                      aria-label={open ? 'Collapse' : 'Expand'}
                      onClick={() => setOpenId(open ? null : purchase.id)}
                      className="p-1 rounded-full hover:bg-muted transition-colors">
                      <Arrow className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TableCell>
                )}
                <TableCell className="p-3">
                  <div className="flex justify-end gap-1">
                    {canDownload ? (
                      <a
                        href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/api/products/${product.id}/versions/${version.id}/download`}
                        aria-label={i18n.t('Download')}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <DownloadIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    ) : null}
                    {product?.slug && (
                      <Link
                        href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    )}
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
                                {c.content(purchase, {dateFormat})}
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
