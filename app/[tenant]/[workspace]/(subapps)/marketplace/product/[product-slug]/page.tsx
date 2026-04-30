import {notFound} from 'next/navigation';
import Link from 'next/link';
import {FaChevronRight} from 'react-icons/fa';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

import {ProductView} from '../../common/ui/components';
import type {MarketplaceProduct} from '../../common/types';

// ---- DUMMY DATA ---- //
const DUMMY_PRODUCTS: MarketplaceProduct[] = [
  {
    id: '1',
    name: 'Axelor CRM Connector',
    slug: 'axelor-crm-connector',
    description: 'Seamlessly integrate your CRM workflows with Axelor AOS',
    longDescription: `<p>The <strong>Axelor CRM Connector</strong> is the most comprehensive integration layer between your external CRM tools and the Axelor Open Suite.</p>
<p>Key features include:</p>
<ul>
  <li>Bi-directional contact and lead synchronisation</li>
  <li>Opportunity pipeline mirroring</li>
  <li>Automated activity logging</li>
  <li>Webhook support for real-time updates</li>
</ul>
<p>Compatible with Axelor AOS 8.x and above. Requires Java 17+.</p>`,
    salePrice: 49.99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '101', name: 'TechSoft Solutions'},
    portalCategorySet: [{id: '1', name: 'CRM & Sales', slug: 'crm-sales'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v1',
        version: '2.1.0',
        releaseNotes:
          'Bug fixes and performance improvements. Removed deprecated API calls.',
        releaseDate: '2026-04-15',
        isLatest: true,
      },
      {
        id: 'v2',
        version: '2.0.0',
        releaseNotes:
          'Complete rewrite with new REST API layer. Breaking changes — see migration guide.',
        releaseDate: '2026-03-01',
        isLatest: false,
      },
      {
        id: 'v3',
        version: '1.3.5',
        releaseNotes: 'Security patch. Upgrade recommended.',
        releaseDate: '2026-01-10',
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
    longDescription: `<p>Eliminate manual invoicing with the <strong>Invoice Automation Suite</strong>.</p>
<p>Set up rules-based automation to generate, approve, and send invoices without human intervention. Supports SEPA, PDF/A archiving, and multi-currency workflows.</p>`,
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
        releaseNotes:
          'SEPA XML export support. Fixed tax rounding on multi-line invoices.',
        releaseDate: '2026-04-01',
        isLatest: true,
      },
      {
        id: 'v4',
        version: '1.4.0',
        releaseNotes: 'Multi-currency support.',
        releaseDate: '2026-02-15',
        isLatest: false,
      },
    ],
    createdOn: '2026-02-10',
  },
  {
    id: '3',
    name: 'HR Leave Manager',
    slug: 'hr-leave-manager',
    description: 'Full-featured leave management with approval workflows',
    longDescription: `<p>Open source leave management built on Axelor HR module.</p>`,
    salePrice: 0,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '103', name: 'OpenHR Community'},
    portalCategorySet: [{id: '3', name: 'HR & Payroll', slug: 'hr-payroll'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v4',
        version: '3.0.1',
        releaseNotes: 'Initial open source release.',
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
    longDescription: `<p>Add a fully interactive Gantt chart to your Axelor Project module. Supports drag-and-drop rescheduling, dependency lines, and milestone markers.</p>`,
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
        releaseNotes: 'Drag-and-drop rescheduling, dependency arrows.',
        releaseDate: '2026-03-15',
        isLatest: true,
      },
      {
        id: 'v6',
        version: '1.0.0',
        releaseNotes: 'Initial release.',
        releaseDate: '2026-02-01',
        isLatest: false,
      },
    ],
    createdOn: '2026-03-15',
  },
  {
    id: '5',
    name: 'Slack Notifications Bridge',
    slug: 'slack-notifications-bridge',
    description: 'Push Axelor alerts and approvals directly to Slack channels',
    longDescription: `<p>Route Axelor workflow notifications to any Slack channel. Configurable per-event-type with rich message formatting.</p>`,
    salePrice: 19.99,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '105', name: 'IntegrateHub'},
    portalCategorySet: [{id: '5', name: 'Integrations', slug: 'integrations'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v6',
        version: '1.0.0',
        releaseNotes: 'First release — supports approval and alert events.',
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
    longDescription: `<p>A next-generation analytics dashboard for your Axelor CRM data. Powered by a new chart engine with real-time data push.</p>`,
    salePrice: 79,
    saleCurrency: {id: '1', symbol: '€'},
    defaultSupplierPartner: {id: '106', name: 'DataViz Labs'},
    portalCategorySet: [{id: '6', name: 'Analytics', slug: 'analytics'}],
    marketplaceStatusSelect: 'published',
    marketplaceVersionList: [
      {
        id: 'v7',
        version: '2.0.0',
        releaseNotes: 'New chart engine, 8 new widget types.',
        releaseDate: '2026-04-20',
        isLatest: true,
      },
      {
        id: 'v8',
        version: '1.5.0',
        releaseNotes: 'Performance improvements.',
        releaseDate: '2026-03-10',
        isLatest: false,
      },
    ],
    createdOn: '2026-04-20',
  },
];
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string; 'product-slug': string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);
  const slug = params['product-slug'];

  const product = DUMMY_PRODUCTS.find(p => p.slug === slug);
  if (!product) notFound();

  // In real implementation: check sale_order_line for this partner + product
  const hasPurchased = false;

  return (
    <div>
      <div className="bg-card border-b">
        <div className="container portal-container py-3">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            <Link
              href={`${workspaceURI}/marketplace`}
              className="hover:underline">
              {await t('Marketplace')}
            </Link>
            {product.portalCategorySet?.[0] && (
              <>
                <FaChevronRight className="text-primary text-[0.6rem]" />
                <Link
                  href={`${workspaceURI}/marketplace/category/${product.portalCategorySet[0].slug}`}
                  className="hover:underline">
                  {product.portalCategorySet[0].name}
                </Link>
              </>
            )}
            <FaChevronRight className="text-primary text-[0.6rem]" />
            <span className="text-foreground font-medium truncate max-w-[24ch]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <ProductView product={product} hasPurchased={hasPurchased} />
    </div>
  );
}
