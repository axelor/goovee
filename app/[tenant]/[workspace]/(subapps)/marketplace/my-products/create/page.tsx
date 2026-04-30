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

import {SellerProductForm} from '../../common/ui/components';
import type {MarketplaceCategory} from '../../common/types';

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
// ---- END DUMMY DATA ---- //

export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
}) {
  const params = await props.params;
  const {workspaceURI} = workspacePathname(params);

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
            <BreadcrumbPage>{await t('New listing')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {await t('Create a new listing')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {await t(
            'Fill in the details below. Your listing will be reviewed before it appears publicly.',
          )}
        </p>
      </div>

      <SellerProductForm
        categories={DUMMY_CATEGORIES}
        workspaceURI={workspaceURI}
      />
    </div>
  );
}
