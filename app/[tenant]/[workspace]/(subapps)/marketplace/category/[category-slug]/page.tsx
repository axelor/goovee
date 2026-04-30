import {notFound} from 'next/navigation';
import Link from 'next/link';
import {MdStorefront, MdAdd} from 'react-icons/md';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from '@/ui/components';
import {ProductList} from '../../common/ui/components';
import type {
  MarketplaceCategory,
  MarketplaceProduct,
  ProductView,
} from '../../common/types';

// ---- DUMMY DATA ---- //
const DUMMY_CATEGORIES: MarketplaceCategory[] = [
  {
    id: '1',
    name: 'CRM & Sales',
    slug: 'crm-sales',
    subtitle: 'Customer relationship tools',
  },
  {
    id: '2',
    name: 'Finance & Accounting',
    slug: 'finance-accounting',
    subtitle: 'Financial management',
  },
  {
    id: '3',
    name: 'HR & Payroll',
    slug: 'hr-payroll',
    subtitle: 'Human resources software',
  },
  {
    id: '4',
    name: 'Project Management',
    slug: 'project-management',
    subtitle: 'Plan and track projects',
  },
  {
    id: '5',
    name: 'Integrations',
    slug: 'integrations',
    subtitle: 'Connect your tools',
  },
  {
    id: '6',
    name: 'Analytics',
    slug: 'analytics',
    subtitle: 'Data and reporting',
  },
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
      {
        id: 'v1',
        version: '2.1.0',
        releaseNotes: 'Bug fixes',
        releaseDate: '2026-04-15',
        isLatest: true,
      },
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
    portalCategorySet: [
      {id: '2', name: 'Finance & Accounting', slug: 'finance-accounting'},
    ],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v3',
        version: '1.4.2',
        releaseNotes: 'SEPA support',
        releaseDate: '2026-04-01',
        isLatest: true,
      },
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
      {
        id: 'v4',
        version: '3.0.1',
        releaseNotes: 'Initial release',
        releaseDate: '2026-01-20',
        isLatest: true,
      },
    ],
    createdOn: '2026-01-20',
  },
];
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'category-slug': string}>;
  searchParams: Promise<{view?: ProductView}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const {workspaceURI} = workspacePathname(params);
  const categorySlug = params['category-slug'];
  const view = searchParams.view === 'list' ? 'list' : 'grid';

  const category = DUMMY_CATEGORIES.find(c => c.slug === categorySlug);
  if (!category) notFound();

  const products = DUMMY_PRODUCTS.filter(p =>
    p.portalCategorySet?.some(c => c.slug === categorySlug),
  );

  return (
    <div>
      <div className="bg-card border-b">
        <div className="container portal-container py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MdStorefront className="text-xl text-primary" />
            </div>
            <div>
              <Breadcrumb className="mb-1">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={`${workspaceURI}/marketplace`}>
                        {await t('Marketplace')}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{category.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-xl font-bold">{category.name}</h1>
              {category.subtitle && (
                <p className="text-sm text-muted-foreground">
                  {category.subtitle}
                </p>
              )}
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href={`${workspaceURI}/marketplace/my-products`}>
              <MdAdd className="text-lg" />
              {await t('Sell your software')}
            </Link>
          </Button>
        </div>
      </div>

      <ProductList
        products={products}
        categories={DUMMY_CATEGORIES}
        workspaceURI={workspaceURI}
        view={view}
        activeCategory={category}
      />
    </div>
  );
}
