import 'server-only';

// ---- CORE IMPORTS ---- //
import {t} from '@/locale/server';
import type {AccessReason} from './ensure-access';

/**
 * Maps a navigation-neutral access reason to an HTTP status for route
 * handlers: a missing workspace or app is 404, an absent session is 401, and a
 * present-but-disallowed visitor is 403.
 */
export function accessStatus(reason: AccessReason): number {
  switch (reason) {
    case 'unauthenticated':
      return 401;
    case 'workspace-not-found':
    case 'app-not-installed':
      return 404;
    case 'no-workspace-access':
    case 'no-app-access':
      return 403;
  }
}

/**
 * Maps a navigation-neutral access reason to a translated message for server
 * actions, which report denial as an error string rather than a status.
 */
export async function accessMessage(reason: AccessReason): Promise<string> {
  switch (reason) {
    case 'workspace-not-found':
      return t('Invalid workspace');
    case 'app-not-installed':
      return t('This app is not available');
    case 'unauthenticated':
    case 'no-workspace-access':
    case 'no-app-access':
      return t('Unauthorized');
  }
}
