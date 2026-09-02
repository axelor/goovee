'use client';

import {useState, useEffect, useMemo} from 'react';
import {usePathname} from 'next/navigation';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {subPathOf} from '@/lib/core/url';
import {fetchEvent} from '@/app/[tenant]/[workspace]/(subapps)/events/common/actions/actions';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

/**
 * Returns a RegExp that matches workspace sub-paths structured like:
 * /{code}/{slug}
 *
 * Matched against the part of the pathname below the workspace, never the
 * pathname itself: how many segments sit in front of the code depends on how
 * the tenant is routed, and only `workspaceURI` knows that.
 *
 * Dynamic Parts:
 * - code: dynamic segment passed to the function (e.g., 'events')
 * - slug: expected to be a UUID (36-character format including hyphens)
 * - Supports optional sub-paths after the slug
 *
 */
const CODE_REGEX = (code: string) =>
  new RegExp(`^\/${code}\/(?<slug>[0-9a-fA-F-]{36})(?:\/.*)?$`);

type VisibilityHandler = (
  subPath: string,
  workspaceURL: string,
  userId: string | undefined,
) => Promise<boolean>;

type Handler = {
  regex?: RegExp;
  code: keyof typeof SUBAPP_CODES;
  visibility: VisibilityHandler;
};

const HANDLERS: Array<Handler> = [
  {
    regex: CODE_REGEX(SUBAPP_CODES.events),
    code: SUBAPP_CODES.events,
    visibility: navigationVisibilityForEvents,
  },
];

async function navigationVisibilityForEvents(
  subPath: string,
  workspaceURL: string,
  userId: string | undefined,
): Promise<boolean> {
  const handler = HANDLERS.find(h => h.code === SUBAPP_CODES.events)!;
  const {regex} = handler;

  const match = subPath.match(regex!);

  if (match?.groups) {
    const {slug} = match.groups;

    const response = await fetchEvent({slug, workspaceURL});
    if (response?.success) {
      const {
        data: {isHidden},
      } = response;

      return userId ? true : !isHidden;
    }

    return false;
  }

  return true;
}

export function useNavigationVisibility() {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();

  const {workspaceURI, workspaceURL} = useWorkspace();
  const {data: session} = authClient.useSession();
  const user = session?.user;
  const userId = user?.id;

  useEffect(() => {
    let mounted = true;

    const handleVisibility = async () => {
      try {
        const subPath = subPathOf(pathname, workspaceURI);

        let matchedHandler: Handler | undefined;

        if (subPath) {
          for (const handler of HANDLERS) {
            const {regex} = handler;
            const match = subPath.match(regex!);

            if (match) {
              matchedHandler = handler;
              break;
            }
          }
        }

        if (matchedHandler && subPath) {
          setLoading(true);
          const visible = await matchedHandler.visibility(
            subPath,
            workspaceURL,
            userId,
          );
          if (mounted) setVisible(visible);
        } else {
          if (mounted) setVisible(true);
        }
      } catch (err) {
        if (mounted) setVisible(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    handleVisibility();

    return () => {
      mounted = false;
    };
  }, [pathname, userId, workspaceURI, workspaceURL]);

  return useMemo(() => ({visible, loading}), [visible, loading]);
}
