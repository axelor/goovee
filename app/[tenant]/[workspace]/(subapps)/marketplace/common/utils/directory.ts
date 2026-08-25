import {SUBAPP_CODES} from '@/constants';
import type {Subapp} from '@/orm/workspace';

/**
 * Whether the Directory is reachable here. It can be absent from a workspace,
 * or closed to this visitor, while the marketplace is open to them — so this
 * has to hold before linking to a profile page, on top of the Directory
 * actually listing the partner.
 */
export function hasDirectoryAccess(apps: Subapp[]) {
  return apps.some(app => app.code === SUBAPP_CODES.directory);
}
