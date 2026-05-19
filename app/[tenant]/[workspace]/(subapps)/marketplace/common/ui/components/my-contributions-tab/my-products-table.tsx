'use client';

import Link from 'next/link';
import {Fragment, useState, type ReactNode} from 'react';
import {ExternalLink, ChevronDown, ChevronUp} from 'lucide-react';
import {i18n} from '@/locale';
import {Rating} from '../rating';
import {InnerHTML} from '@/ui/components/inner-html';
import {cn} from '@/utils/css';
import {SUBAPP_CODES, RESPONSIVE_SIZES} from '@/constants';
import {useResponsive} from '@/ui/hooks';
import type {Cloned} from '@/types/util';
import {Collapsible, CollapsibleContent} from '@/ui/components/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/components/table';
import {ProductIcon} from '../product-icon';
import {EditProductLauncher} from './edit-product-launcher';
import {MARKETPLACE_VERSION_STATUS} from '../../../constants/statuses';
import type {
  CompatibilityVersion,
  ListCategory,
  ListMyProduct,
} from '../../../orm/orm';

type Product = Cloned<ListMyProduct>;

type Column = {
  key: string;
  label: string;
  mobile?: boolean;
  /** Extra Tailwind classes applied to the cell on desktop only. */
  desktopClassName?: string;
  content: (p: Product) => ReactNode;
};

type Props = {
  products: Product[];
  title: string;
  workspaceURI: string;
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
};

export function MyProductsTable({
  products,
  title,
  workspaceURI,
  workspaceURL,
  categories,
  compatibilityVersions,
  requiresReview,
}: Props) {
  const responsive = useResponsive();
  const small = RESPONSIVE_SIZES.some(size => responsive[size]);
  const [openId, setOpenId] = useState<string | null>(null);

  const columns: Column[] = [
    {
      key: 'name',
      label: i18n.t('Name'),
      mobile: true,
      desktopClassName: 'w-[38%] min-w-[220px]',
      content: product => (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
            <ProductIcon
              code={product.marketplaceIconCode}
              className="w-6 h-6"
            />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-foreground truncate">
              {product.name}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-2">
              <InnerHTML content={product.description ?? undefined} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: i18n.t('Status'),
      desktopClassName: 'w-[15%]',
      content: product => (
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap',
            product.currentVersion?.statusSelect ===
              MARKETPLACE_VERSION_STATUS.PUBLISHED
              ? 'bg-success/15 text-success-dark'
              : 'bg-muted text-muted-foreground',
          )}>
          {product.currentVersion?.statusSelect
            ? i18n.tattr(product.currentVersion.statusSelect)
            : '—'}
        </span>
      ),
    },
    {
      key: 'version',
      label: i18n.t('Current version'),
      desktopClassName: 'w-[15%]',
      content: product => (
        <span className="text-sm whitespace-nowrap">
          v{product.currentVersion?.versionNumber || '—'}
        </span>
      ),
    },
    {
      key: 'installs',
      label: i18n.t('Installs'),
      desktopClassName: 'w-[15%]',
      content: product => (
        <span className="text-sm">{product.installCount ?? 0}</span>
      ),
    },
    {
      key: 'rating',
      label: i18n.t('Rating'),
      desktopClassName: 'w-[15%]',
      content: product => <Rating value={product.averageRating} />,
    },
  ];

  const mainColumns = small ? columns.filter(c => c.mobile) : columns;
  const subColumns = small ? columns.filter(c => !c.mobile) : [];

  if (products.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border px-6 py-12 text-center">
        <div className="text-sm text-muted-foreground">
          {i18n.t('No {0} yet', title.toLowerCase())}
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
        {products.map(product => {
          const open = openId === product.id;
          const Arrow = open ? ChevronUp : ChevronDown;
          return (
            <Fragment key={product.id}>
              <TableRow>
                {mainColumns.map(c => (
                  <TableCell
                    key={c.key}
                    className={cn('p-3', !small && c.desktopClassName)}>
                    {c.content(product)}
                  </TableCell>
                ))}
                {small && subColumns.length > 0 && (
                  <TableCell className="p-3 w-10">
                    <button
                      type="button"
                      aria-label={open ? 'Collapse' : 'Expand'}
                      onClick={() => setOpenId(open ? null : product.id)}
                      className="p-1 rounded-full hover:bg-muted transition-colors">
                      <Arrow className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </TableCell>
                )}
                <TableCell className="p-3">
                  <div className="flex justify-end gap-1">
                    <EditProductLauncher
                      productId={product.id}
                      workspaceURI={workspaceURI}
                      workspaceURL={workspaceURL}
                      categories={categories}
                      compatibilityVersions={compatibilityVersions}
                      requiresReview={requiresReview}
                    />
                    <Link
                      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`}
                      className="p-1.5 rounded-full hover:bg-muted transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
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
                                {c.content(product)}
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
