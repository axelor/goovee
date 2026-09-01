import type {MetadataRoute} from 'next';

// ---- CORE IMPORTS ---- //
import {buildManifest} from '@/lib/core/pwa/manifest';
import {withBasePath} from '@/lib/core/path/base-path';

/* The deployment-level manifest, linked from the pages that name no tenant (`/`
 * and `/auth/*`). Tenant pages link their own `/<tenant>/manifest.webmanifest`.
 * Where an origin carries several tenants that installs as a separate app, each
 * launching into its own tenant; on an origin holding one tenant reached by host
 * the two are the same app, because an app is identified by the address it
 * launches at and both launch at the root.
 *
 * Installing from here launches `/`, which resolves a landing workspace only
 * where the host names a tenant or the document declares a default; with
 * neither, `/` names no tenant and so resolves nothing. */
export default function manifest(): MetadataRoute.Manifest {
  const root = withBasePath('/');

  return buildManifest({id: root, startUrl: root, scope: root});
}
