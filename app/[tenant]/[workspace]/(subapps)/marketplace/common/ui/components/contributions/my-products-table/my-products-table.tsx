'use client';

import {RESPONSIVE_SIZES, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Collapsible, CollapsibleContent} from '@/ui/components/collapsible';
import {InnerHTML} from '@/ui/components/inner-html';
import {StatusPill} from '@/ui/components/status-pill';
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
import {ChevronDown, ChevronUp, ExternalLink, Eye} from 'lucide-react';
import {Link} from '@/ui/components/link';
import {Fragment, useState, type ReactNode} from 'react';
import {DEFAULT_GRADIENT, GRADIENT_MAP} from '../../../../constants/gradients';
import {
  MARKETPLACE_VERSION_STATUS_LABELS,
  MARKETPLACE_VERSION_STATUS_TONES,
  PRODUCT_MODERATION_STATUS,
  PRODUCT_MODERATION_STATUS_LABELS,
  PRODUCT_MODERATION_STATUS_TONES,
} from '../../../../constants/statuses';

import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  ListMyProduct,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {EditProductButton} from '../../product/edit-product-button';
import {ProductIcon} from '../../shared/product-icon';
import {ProductTypeBadge} from '../../shared/product-type-badge';
import {Rating} from '../../shared/rating';

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
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  newListingCurrency: Cloned<Currency> | null;
  inAti: boolean;
};

export function MyProductsTable({
  products,
  title,
  workspaceURI,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  newListingCurrency,
  inAti,
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
      content: product => {
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
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-medium text-ink-900 truncate">
                  {product.name}
                </div>
                {product.marketplaceTypeSelect && (
                  <ProductTypeBadge
                    type={product.marketplaceTypeSelect}
                    label={i18n.tattr(product.marketplaceTypeSelect)}
                    className="flex-shrink-0"
                  />
                )}
              </div>
              <div className="text-xs text-ink-500 line-clamp-2">
                <InnerHTML content={product.description ?? undefined} />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: i18n.t('Status'),
      desktopClassName: 'w-[15%]',
      content: product => {
        const moderation = product.moderationStatusSelect;
        if (
          moderation !== PRODUCT_MODERATION_STATUS.ACTIVE &&
          PRODUCT_MODERATION_STATUS_LABELS[moderation]
        ) {
          return (
            <StatusPill
              status={PRODUCT_MODERATION_STATUS_TONES[moderation] ?? 'draft'}
              size="sm"
              title={product.moderationReason ?? undefined}>
              {i18n.t(PRODUCT_MODERATION_STATUS_LABELS[moderation])}
            </StatusPill>
          );
        }
        const status = product.latestVersion?.statusSelect ?? null;
        if (!status || !MARKETPLACE_VERSION_STATUS_LABELS[status]) {
          return <span className="text-sm text-ink-500">{'—'}</span>;
        }
        return (
          <StatusPill
            status={MARKETPLACE_VERSION_STATUS_TONES[status] ?? 'draft'}
            size="sm">
            {i18n.t(MARKETPLACE_VERSION_STATUS_LABELS[status])}
          </StatusPill>
        );
      },
    },
    {
      key: 'version',
      label: i18n.t('Latest version'),
      desktopClassName: 'w-[15%]',
      content: product => {
        const latest = product.latestVersion;
        const current = product.currentVersion;
        const showLiveHint = !!latest && !!current && latest.id !== current.id;
        return (
          <div className="text-sm whitespace-nowrap">
            <div>{latest ? `v${formatVersionNumber(latest)}` : '—'}</div>
            {showLiveHint && current && (
              <div className="text-xs text-ink-500">
                {i18n.t('live: v{0}', formatVersionNumber(current))}
              </div>
            )}
          </div>
        );
      },
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
      <div className="bg-white rounded-lg border border-ink-100 px-6 py-12 text-center">
        <div className="text-sm text-ink-500">
          {i18n.t('No {0} yet', title.toLowerCase())}
        </div>
      </div>
    );
  }

  return (
    <Table
      className={cn(
        'rounded-lg border border-ink-100 bg-white text-ink-900',
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
                      className="p-1 rounded-full hover:bg-ink-50 transition-colors">
                      <Arrow className="w-4 h-4 text-ink-500" />
                    </button>
                  </TableCell>
                )}
                <TableCell className="p-3">
                  <div className="flex justify-end gap-1">
                    <EditProductButton
                      productId={product.id}
                      workspaceURI={workspaceURI}
                      categories={categories}
                      licenses={licenses}
                      compatibilityVersions={compatibilityVersions}
                      requiresReview={requiresReview}
                      allowToPublish={allowToPublish}
                      listingCurrency={
                        product.saleCurrency ?? newListingCurrency
                      }
                      inAti={product.inAti ?? inAti}
                      moderationLocked={
                        product.moderationStatusSelect !==
                        PRODUCT_MODERATION_STATUS.ACTIVE
                      }
                    />
                    {product.currentVersion ? (
                      <Link
                        href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}`}
                        title={i18n.t('View live')}
                        className="p-1.5 rounded-full hover:bg-ink-50 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5 text-ink-500" />
                      </Link>
                    ) : (
                      <Link
                        href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/products/${product.slug}?preview=1`}
                        title={i18n.t('Preview')}
                        className="p-1.5 rounded-full hover:bg-ink-50 transition-colors">
                        <Eye className="w-3.5 h-3.5 text-ink-500" />
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {small && subColumns.length > 0 && (
                <Collapsible open={open} asChild>
                  <TableRow className="bg-ink-50/30">
                    <CollapsibleContent asChild>
                      <TableCell colSpan={mainColumns.length + 2}>
                        <div className="grid grid-cols-2 gap-y-2 items-center px-2 py-1">
                          {subColumns.map(c => (
                            <Fragment key={c.key}>
                              <div className="text-xs font-semibold uppercase text-ink-500">
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
