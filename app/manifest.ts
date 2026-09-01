import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* The deployment-level manifest, linked from the pages that name no tenant (`/`
 * and `/auth/*`). Tenant pages link their own `/<tenant>/manifest.webmanifest`,
 * which installs as a separate app. Installing from here launches `/`, which
 * resolves a landing workspace only where the document declares a default
 * tenant; without one, `/` names no tenant and so resolves nothing. */
export default function manifest(): MetadataRoute.Manifest {
  const root = withBasePath('/');

  return buildManifest({id: root, startUrl: root, scope: root});
}
