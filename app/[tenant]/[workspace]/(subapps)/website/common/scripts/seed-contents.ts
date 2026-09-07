import '@/load-swc-env';
import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {seedContents} from '@/subapps/website/common/utils/templates';

runTenantScript({
  command: 'pnpm website:contents:seed',
  title: 'Website content seeder',
  summary: `Creates the demo content for every website template. Requires the
templates to have been seeded first.`,
  run: async ({openTenant}) => {
    const {client, config} = await openTenant();

    /* The demo content carries files, which belong under the storage root of
     * the tenant being seeded rather than any process-wide one. */
    const contents = await seedContents(client, config.aos.storage);
    out.ok(
      `Contents seeded successfully — ${contents.flat().length} contents across ${contents.length} templates.`,
    );
  },
});
