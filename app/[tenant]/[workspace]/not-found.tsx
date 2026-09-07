'use client';

import {MdHome} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ErrorScreen} from '@/ui/components/error-screen';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {useWorkspace} from './workspace-context';

/**
 * The workspace's own not-found, rendered inside its shell — the sidebar and
 * header stay, with no active nav item, so the visitor is still somewhere
 * rather than nowhere.
 *
 * Reached only by a page of this workspace answering not-found. A workspace
 * layout answering instead is caught a level up, by the tenant's boundary, so
 * the workspace provider below is always mounted by the time this renders.
 *
 * Translated, unlike the boundaries above it: the workspace resolved, so the
 * tenant's own translations are loaded.
 */
export default function NotFound() {
  const {scope} = useWorkspace();

  return (
    <ErrorScreen
      watermark="404"
      badge={i18n.t('Error 404')}
      heading={i18n.t('This page seems to be unreachable')}
      description={i18n.t(
        'The link may be outdated or the resource has been moved. Head back to your workspace to continue.',
      )}
      action={{
        href: scope.forRouter(),
        label: i18n.t('Return Home'),
        icon: <MdHome className="size-[18px]" />,
      }}
    />
  );
}
