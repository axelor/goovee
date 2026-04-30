import Link from 'next/link';
import {FaChevronRight} from 'react-icons/fa';

import {t} from '@/locale/server';
import {workspacePathname} from '@/utils/workspace';

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
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
        <Link href={`${workspaceURI}/marketplace`} className="hover:underline">
          {await t('Marketplace')}
        </Link>
        <FaChevronRight className="text-primary text-[0.6rem]" />
        <Link
          href={`${workspaceURI}/marketplace/my-products`}
          className="hover:underline">
          {await t('My products')}
        </Link>
        <FaChevronRight className="text-primary text-[0.6rem]" />
        <span className="text-foreground font-medium">
          {await t('New listing')}
        </span>
      </nav>

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
