import 'server-only';
import {notFound, redirect, unauthorized} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS} from '@/constants';
import {currentWorkspace} from '@/lib/core/url/current';
import {t} from '@/locale/server';
import {getCurrentPath} from '@/utils/current-path';
import {getLoginURL} from '@/utils/url';
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

/**
 * Answers a denied page in the medium a page has: not-found for something that
 * does not exist, a sign-in screen where signing in can still change the
 * answer, and forbidden for a visitor simply not allowed in.
 *
 * The sibling of `accessStatus` and `accessMessage` for the third caller —
 * `AccessReason` is deliberately navigation-neutral, and this is where a page
 * turns it into navigation.
 *
 * Never returns: every branch leaves through one of Next's navigation throws.
 * Written at the call site as `if (!access.ok) return denyPage(access);`, which
 * is what narrows `access` to its granted shape below.
 *
 * The workspace comes from the request rather than from `access`, because a
 * denial carries no workspace to build a sign-in address from — that is the
 * whole reason a page cannot get this from the gate's result.
 */
export async function denyPage(access: {reason: AccessReason}): Promise<never> {
  if (
    access.reason === 'workspace-not-found' ||
    access.reason === 'app-not-installed'
  ) {
    notFound();
  }

  /* The one reason signing in can still answer, and the gate reports it only
   * for what it confirmed exists — so nobody is sent here for an address that
   * names nothing. */
  if (access.reason === 'unauthenticated') {
    const scope = await currentWorkspace();

    redirect(
      getLoginURL({
        callbackurl: await getCurrentPath(),
        workspaceURI: scope?.forRouter(),
        [SEARCH_PARAMS.TENANT_ID]: scope?.tenantId,
      }),
    );
  }

  unauthorized();
}
