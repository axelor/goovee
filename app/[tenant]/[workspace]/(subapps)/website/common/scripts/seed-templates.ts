import '@/load-swc-env';
import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {seedComponents} from '@/subapps/website/common/utils/templates';

runTenantScript({
  command: 'pnpm website:templates:seed',
  title: 'Website template seeder',
  summary: `Creates the CMS components, JSON models, selections and custom fields
that the website templates are built from.`,
  run: async ({openTenant}) => {
    const {client} = await openTenant();

    await seedComponents(client);
    out.ok('Templates seeded successfully.');
  },
});
