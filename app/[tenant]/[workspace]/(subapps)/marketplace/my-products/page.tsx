import Link from 'next/link';
import {MdAdd, MdEdit, MdOpenInNew, MdDelete} from 'react-icons/md';
import {FaChevronRight} from 'react-icons/fa';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

import {STATUS_COLORS, STATUS_LABELS} from '../common/constants';
import type {MarketplaceProduct} from '../common/types';

// ---- DUMMY DATA ---- //
const DUMMY_SELLER_PRODUCTS: MarketplaceProduct[] = [
  {
    id: '1',
    name: 'Axelor CRM Connector',
    slug: 'axelor-crm-connector',
    description: 'Seamlessly integrate your CRM workflows with Axelor AOS',
    salePrice: 49.99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '101', name: 'TechSoft Solutions'},
    portalCategorySet: [{id: '1', name: 'CRM & Sales', slug: 'crm-sales'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v1',
        version: '2.1.0',
        releaseNotes: '',
        releaseDate: '2026-04-15',
        isLatest: true,
      },
      {
        id: 'v2',
        version: '2.0.0',
        releaseNotes: '',
        releaseDate: '2026-03-01',
        isLatest: false,
      },
    ],
    createdOn: '2026-03-01',
  },
  {
    id: '5',
    name: 'Slack Notifications Bridge',
    slug: 'slack-notifications-bridge',
    description: 'Push Axelor alerts and approvals directly to Slack channels',
    salePrice: 19.99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '101', name: 'TechSoft Solutions'},
    portalCategorySet: [{id: '5', name: 'Integrations', slug: 'integrations'}],
    marketplaceStatusSelect: 'submitted',
    marketplaceVersionList: [
      {
        id: 'v6',
        version: '1.0.0',
        releaseNotes: '',
        releaseDate: '2026-04-10',
        isLatest: true,
      },
    ],
    createdOn: '2026-04-10',
  },
  {
    id: '7',
    name: 'My Draft Plugin',
    slug: 'my-draft-plugin',
    description: 'Work in progress — not yet ready for review',
    salePrice: 0,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '101', name: 'TechSoft Solutions'},
    portalCategorySet: [],
    marketplaceStatusSelect: 'draft',
    marketplaceVersionList: [],
    createdOn: '2026-04-28',
  },
];
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);

  return (
    <div className="container portal-container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Link
              href={`${workspaceURI}/marketplace`}
              className="hover:underline">
              {await t('Marketplace')}
            </Link>
            <FaChevronRight className="text-primary text-[0.6rem]" />
            <span className="text-foreground font-medium">
              {await t('My products')}
            </span>
          </nav>
          <h1 className="text-2xl font-bold">{await t('My products')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {await t('Manage the software you sell on the marketplace')}
          </p>
        </div>
        <Link
          href={`${workspaceURI}/marketplace/my-products/create`}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          <MdAdd className="text-lg" />
          {await t('New listing')}
        </Link>
      </div>

      {DUMMY_SELLER_PRODUCTS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 border-2 border-dashed rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl">
            📦
          </div>
          <div className="text-center">
            <p className="font-semibold">
              {await t("You haven't listed any products yet")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {await t('Start selling your software on the marketplace')}
            </p>
          </div>
          <Link
            href={`${workspaceURI}/marketplace/my-products/create`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-2">
            <MdAdd className="text-lg" />
            {await t('Create your first listing')}
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  {await t('Product')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  {await t('Category')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">
                  {await t('Status')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {await t('Versions')}
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">
                  {await t('Price')}
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  {await t('Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {DUMMY_SELLER_PRODUCTS.map(product => {
                const price =
                  product.salePrice === 0
                    ? 'Free'
                    : `${product.saleCurrency?.symbol ?? '€'}${product.salePrice.toFixed(2)}`;
                const versionCount =
                  product.marketplaceVersionList?.length ?? 0;
                const latestVersion = product.marketplaceVersionList?.find(
                  v => v.isLatest,
                );
                const canDelete = product.marketplaceStatusSelect === 'draft';

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium line-clamp-1">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 hidden md:block">
                          {product.description}
                        </p>
                      )}
                      {latestVersion && (
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono hidden md:block">
                          v{latestVersion.version}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4 hidden md:table-cell">
                      {product.portalCategorySet?.[0] ? (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {product.portalCategorySet[0].name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span
                        className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[product.marketplaceStatusSelect]}`}>
                        {STATUS_LABELS[product.marketplaceStatusSelect]}
                      </span>
                    </td>

                    <td className="px-4 py-4 hidden lg:table-cell text-muted-foreground text-xs">
                      {versionCount === 0
                        ? '—'
                        : `${versionCount} version${versionCount !== 1 ? 's' : ''}`}
                    </td>

                    <td className="px-4 py-4 hidden lg:table-cell font-medium text-xs">
                      {price}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {product.marketplaceStatusSelect === 'published' && (
                          <Link
                            href={`${workspaceURI}/marketplace/product/${product.slug}`}
                            title="View public listing"
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                            <MdOpenInNew className="text-base" />
                          </Link>
                        )}
                        <Link
                          href={`${workspaceURI}/marketplace/my-products/${product.id}`}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <MdEdit className="text-base" />
                        </Link>
                        {canDelete && (
                          <button
                            title="Delete draft"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <MdDelete className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
