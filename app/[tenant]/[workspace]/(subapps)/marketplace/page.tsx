import Link from 'next/link';
import {MdStorefront, MdAdd} from 'react-icons/md';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

import {ProductList} from './common/ui/components';
import type {
  MarketplaceCategory,
  MarketplaceProduct,
  ProductView,
} from './common/types';

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
        releaseNotes: 'Bug fixes and performance improvements',
        releaseDate: '2026-04-15',
        isLatest: true,
      },
      {
        id: 'v2',
        version: '2.0.0',
        releaseNotes: 'Major rewrite with new API',
        releaseDate: '2026-03-01',
        isLatest: false,
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
        releaseNotes: 'SEPA support added',
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
        releaseNotes: 'Initial open source release',
        releaseDate: '2026-01-20',
        isLatest: true,
      },
    ],
    createdOn: '2026-01-20',
  },
  {
    id: '4',
    name: 'Project Gantt View',
    slug: 'project-gantt-view',
    description: 'Interactive Gantt chart for Axelor Project module',
    salePrice: 29,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '104', name: 'Devcraft Studio'},
    portalCategorySet: [
      {id: '4', name: 'Project Management', slug: 'project-management'},
    ],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v5',
        version: '1.1.0',
        releaseNotes: 'Drag-and-drop rescheduling',
        releaseDate: '2026-03-15',
        isLatest: true,
      },
    ],
    createdOn: '2026-03-15',
  },
  {
    id: '5',
    name: 'Slack Notifications Bridge',
    slug: 'slack-notifications-bridge',
    description: 'Push Axelor alerts and approvals directly to Slack channels',
    salePrice: 19.99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '105', name: 'IntegrateHub'},
    portalCategorySet: [{id: '5', name: 'Integrations', slug: 'integrations'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v6',
        version: '1.0.0',
        releaseNotes: 'First release',
        releaseDate: '2026-04-10',
        isLatest: true,
      },
    ],
    createdOn: '2026-04-10',
  },
  {
    id: '6',
    name: 'Sales Analytics Dashboard',
    slug: 'sales-analytics-dashboard',
    description: 'Real-time sales KPIs and pipeline analytics for Axelor CRM',
    salePrice: 79,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '106', name: 'DataViz Labs'},
    portalCategorySet: [{id: '6', name: 'Analytics', slug: 'analytics'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v7',
        version: '2.0.0',
        releaseNotes: 'New chart engine',
        releaseDate: '2026-04-20',
        isLatest: true,
      },
    ],
    createdOn: '2026-04-20',
  },
];
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<{view?: ProductView}>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const {workspaceURI} = workspacePathname(params);
  const view = searchParams.view === 'list' ? 'list' : 'grid';

  return (
    <div>
      <div className="bg-card border-b">
        <div className="container portal-container py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MdStorefront className="text-2xl text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{await t('Marketplace')}</h1>
              <p className="text-sm text-muted-foreground">
                {await t(
                  'Discover and install software built by the community',
                )}
              </p>
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
        products={DUMMY_PRODUCTS}
        categories={DUMMY_CATEGORIES}
        workspaceURI={workspaceURI}
        view={view}
      />
    </div>
  );
}
