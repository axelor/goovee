import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* The origin-level manifest for tenant-less pages. Tenant pages link their own
 * `/<tenant>/manifest.webmanifest` (see app/[tenant]/manifest.webmanifest), so
 * an installed PWA launches inside that tenant's service-worker scope. */
export default function manifest(): MetadataRoute.Manifest {
  return buildManifest(withBasePath('/'));
}
