import {notFound} from 'next/navigation';
import Link from 'next/link';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui/components';

import {SellerProductForm} from '../../common/ui/components/seller-product-form';
import type {MarketplaceProduct} from '../../common/types';

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
        releaseNotes: 'Bug fixes and performance improvements',
        releaseDate: '2026-04-15',
        isLatest: true,
      },
      {
        id: 'v2',
        version: '2.0.0',
        releaseNotes: 'Complete rewrite with new REST API layer.',
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
        releaseNotes: 'First release.',
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

const DUMMY_CATEGORIES = [
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
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; id: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);

  const product = DUMMY_SELLER_PRODUCTS.find(p => p.id === params.id);
  if (!product) notFound();

  const initialValues = {
    name: product.name,
    description: product.description ?? '',
    longDescription: product.longDescription ?? '',
    isFree: product.salePrice === 0,
    salePrice: product.salePrice,
    categoryIds: product.portalCategorySet?.map(c => c.id) ?? [],
    versions:
      product.marketplaceVersionList?.map(v => ({
        _key: v.id,
        version: v.version,
        releaseNotes: v.releaseNotes ?? '',
        releaseDate: v.releaseDate ?? '',
        isLatest: v.isLatest,
        file: null,
        fileName: '',
      })) ?? [],
  };

  return (
    <div className="container portal-container py-8">
      <Breadcrumb className="mb-6">
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
            <BreadcrumbLink asChild>
              <Link href={`${workspaceURI}/marketplace/my-products`}>
                {await t('My products')}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate max-w-[24ch]">
              {product.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{await t('Edit listing')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {await t('Update your product details below.')}
        </p>
      </div>

      <SellerProductForm
        categories={DUMMY_CATEGORIES}
        workspaceURI={workspaceURI}
        initialValues={initialValues}
      />
    </div>
  );
}
