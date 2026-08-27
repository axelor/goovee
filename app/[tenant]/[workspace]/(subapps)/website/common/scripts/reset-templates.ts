import '@/load-swc-env';
import * as out from '@/scripts/lib/output';
import {runTenantScript} from '@/scripts/lib/tenant-script';
import {resetFields} from '@/subapps/website/common/utils/templates';

runTenantScript({
  command: 'pnpm website:templates:reset',
  title: 'Website template reset',
  summary: `Removes the custom fields, JSON models and selections created by the
template seeder. The components themselves are left in place.`,
  run: async ({openTenant}) => {
    const {client} = await openTenant();

    await resetFields(client);
    out.ok('Templates reset successfully. Components are not deleted.');
  },
});
