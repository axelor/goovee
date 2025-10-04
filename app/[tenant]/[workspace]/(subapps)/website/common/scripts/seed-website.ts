import '@/load-swc-env';
import {seedWebsite} from '@/subapps/website/common/utils/templates';

const tenantId = process.env.MULTI_TENANCY === 'true' ? process.argv[2] : 'd';

if (!tenantId) {
  console.error('\x1b[31m✖ Tenant id is required.\x1b[0m');
  process.exit(1);
}

seedWebsite(tenantId)
  .then(res => {
    console.log('\x1b[32m🔥 Success:\x1b[0m Website seeded successfully!');
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
