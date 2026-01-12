'use client';

import {useState, useEffect, useMemo} from 'react';
import {usePathname} from 'next/navigation';
import {authClient} from '@/lib/auth-client';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {fetchEvent} from '@/app/[tenant]/[workspace]/(subapps)/events/common/actions/actions';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

/**
 * Returns a RegExp that matches paths structured like:
 * /{tenant}/{workspace}/{code}/{slug}
 *
 * Dynamic Parts:
 * - tenant: any string without slashes
 * - workspace: any string without slashes
 * - code: dynamic segment passed to the function (e.g., 'events')
 * - slug: expected to be a UUID (36-character format including hyphens)
 * - Supports optional sub-paths after the slug
 *
 */
const CODE_REGEX = (code: string) =>
  new RegExp(
    `^\/(?<tenant>[^\\/]+)\/(?<workspace>[^\\/]+)\/${code}\/(?<slug>[0-9a-fA-F-]{36})(?:\/.*)?$`,
  );

type VisibilityHandler = (
  pathname: string,
  workspaceURL: string,
  user: any,
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
  pathname: string,
  workspaceURL: string,
  user: any,
): Promise<boolean> {
  const handler = HANDLERS.find(h => h.code === SUBAPP_CODES.events)!;
  const {regex} = handler;

  const match = pathname.match(regex!);

  if (match?.groups) {
    const {slug} = match.groups;

    const response = await fetchEvent({slug, workspaceURL});
    if (response?.success) {
      const {
        data: {isHidden},
      } = response;

      return user ? true : !isHidden;
    }

    return false;
  }

  return true;
}

export function useNavigationVisibility() {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();

  const {workspaceURL} = useWorkspace();
  const {data: session} = authClient.useSession();
  const user = session?.user;

  useEffect(() => {
    let mounted = true;

    const handleVisibility = async () => {
      try {
        let matchedHandler: Handler | undefined;

        for (const handler of HANDLERS) {
          const {regex} = handler;
          const match = pathname.match(regex!);

          if (match) {
            matchedHandler = handler;
            break;
          }
        }

        if (matchedHandler) {
          setLoading(true);
          const visible = await matchedHandler.visibility(
            pathname,
            workspaceURL,
            user,
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
  }, [pathname, user, workspaceURL]);

  return useMemo(() => ({visible, loading}), [visible, loading]);
}
