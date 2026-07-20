import '@/load-swc-env';
import {seedContents} from '@/subapps/website/common/utils/templates';
import {manager} from '@/tenant';

const tenantId = process.env.MULTI_TENANCY === 'true' ? process.argv[2] : 'd';

if (!tenantId) {
  console.error('\x1b[31m✖ Tenant id is required.\x1b[0m');
  process.exit(1);
}

manager
  .getTenant(tenantId)
  .then(tenant => {
    if (!tenant) {
      console.error('\x1b[31m✖ Tenant not found.\x1b[0m');
      process.exit(1);
    }
    return seedContents(tenant.client, tenant.config.aos.storage);
  })
  .then(res => {
    const failed = res.filter(res => res.status === 'rejected');
    if (failed.length) {
      console.log('\x1b[31m🔥 Failed:\x1b[0m');
      console.dir(failed, {depth: null});
    }
    console.log('\x1b[32m🔥 Success:\x1b[0m Contents seeded successfully!');
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
