'use client';

import {useState} from 'react';

import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import type {MarketplaceProduct} from '../../../types';
import {VersionList} from '../version-list';

type Tab = 'description' | 'versions';

type ProductViewTabsProps = {
  product: MarketplaceProduct;
  hasPurchased: boolean;
};

export function ProductViewTabs({product, hasPurchased}: ProductViewTabsProps) {
  const [tab, setTab] = useState<Tab>('description');

  return (
    <div>
      <div className="flex gap-1 border-b">
        {(['description', 'versions'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}>
            {t === 'versions'
              ? i18n.t(
                  'Versions ({0})',
                  String(product.marketplaceVersionList?.length ?? 0),
                )
              : i18n.t('Description')}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {tab === 'description' ? (
          product.longDescription ? (
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{__html: product.longDescription}}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {product.description ?? i18n.t('No description provided.')}
            </p>
          )
        ) : (
          <VersionList
            versions={product.marketplaceVersionList ?? []}
            productId={product.id}
            hasPurchased={hasPurchased}
          />
        )}
      </div>
    </div>
  );
}
