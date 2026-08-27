import '@/load-swc-env';
import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {seedWebsite} from '@/subapps/website/common/utils/templates';

runTenantScript({
  command: 'pnpm website:sites:seed',
  title: 'Website seeder',
  summary: `Creates the demo sites and their pages from the seeded content, and
sets each site's homepage. Requires the contents to have been seeded first.`,
  run: async ({openTenant}) => {
    const {client} = await openTenant();

    await seedWebsite(client);
    out.ok('Website seeded successfully.');
  },
});
