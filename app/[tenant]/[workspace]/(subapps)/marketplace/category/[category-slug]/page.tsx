import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {MdStorefront, MdAdd} from 'react-icons/md';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

import {ProductList} from '../../common/ui/components';
import type {MarketplaceCategory, MarketplaceProduct} from '../../common/types';

// ---- DUMMY DATA (shared shape — replace with ORM calls) ---- //
const DUMMY_CATEGORIES: MarketplaceCategory[] = [
  {id: '1', name: 'CRM & Sales', slug: 'crm-sales', subtitle: 'Customer relationship tools'},
  {id: '2', name: 'Finance & Accounting', slug: 'finance-accounting', subtitle: 'Financial management'},
  {id: '3', name: 'HR & Payroll', slug: 'hr-payroll', subtitle: 'Human resources software'},
  {id: '4', name: 'Project Management', slug: 'project-management', subtitle: 'Plan and track projects'},
  {id: '5', name: 'Integrations', slug: 'integrations', subtitle: 'Connect your tools'},
  {id: '6', name: 'Analytics', slug: 'analytics', subtitle: 'Data and reporting'},
];

const DUMMY_PRODUCTS: MarketplaceProduct[] = [
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
      {id: 'v1', version: '2.1.0', releaseNotes: 'Bug fixes', releaseDate: '2026-04-15', isLatest: true},
    ],
    createdOn: '2026-03-01',
  },
  {
    id: '2',
    name: 'Invoice Automation Suite',
    slug: 'invoice-automation-suite',
    description: 'Automate your invoicing process end-to-end with smart rules',
    salePrice: 99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '102', name: 'FinTools GmbH'},
    portalCategorySet: [{id: '2', name: 'Finance & Accounting', slug: 'finance-accounting'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {id: 'v3', version: '1.4.2', releaseNotes: 'SEPA support', releaseDate: '2026-04-01', isLatest: true},
    ],
    createdOn: '2026-02-10',
  },
  {
    id: '3',
    name: 'HR Leave Manager',
    slug: 'hr-leave-manager',
    description: 'Full-featured leave management with approval workflows',
    salePrice: 0,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '103', name: 'OpenHR Community'},
    portalCategorySet: [{id: '3', name: 'HR & Payroll', slug: 'hr-payroll'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {id: 'v4', version: '3.0.1', releaseNotes: 'Initial release', releaseDate: '2026-01-20', isLatest: true},
    ],
    createdOn: '2026-01-20',
  },
];
// ---- END DUMMY DATA ---- //

async function CategoryPage({
  params,
}: {
  params: {tenant: string; workspace: string; 'category-slug': string};
}) {
  const {workspaceURI} = workspacePathname(params);
  const categorySlug = params['category-slug'];

  const category = DUMMY_CATEGORIES.find(c => c.slug === categorySlug);
  if (!category) notFound();

  const products = DUMMY_PRODUCTS.filter(p =>
    p.portalCategorySet?.some(c => c.slug === categorySlug),
  );

  return (
    <div>
      {/* Hero strip */}
      <div className="bg-card border-b">
        <div className="container portal-container py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MdStorefront className="text-xl text-primary" />
            </div>
            <div>
              <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Link href={`${workspaceURI}/marketplace`} className="hover:underline">
                  {await t('Marketplace')}
                </Link>
                <span>/</span>
                <span className="text-foreground font-medium">{category.name}</span>
              </nav>
              <h1 className="text-xl font-bold">{category.name}</h1>
              {category.subtitle && (
                <p className="text-sm text-muted-foreground">{category.subtitle}</p>
              )}
            </div>
          </div>
          <Link
            href={`${workspaceURI}/marketplace/my-products`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0">
            <MdAdd className="text-lg" />
            {await t('Sell your software')}
          </Link>
        </div>
      </div>

      <ProductList
        products={products}
        categories={DUMMY_CATEGORIES}
        workspaceURI={workspaceURI}
        activeCategory={category}
      />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="container portal-container py-8 flex flex-col gap-4">
      <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({length: 3}).map((_, i) => (
          <div key={i} className="rounded-2xl bg-muted h-64 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'category-slug': string}>;
}) {
  const params = await props.params;
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryPage params={params} />
    </Suspense>
  );
}
