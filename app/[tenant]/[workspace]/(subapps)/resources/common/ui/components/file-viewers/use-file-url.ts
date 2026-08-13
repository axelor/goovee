'use client';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {DmsFile} from '@/subapps/resources/common/types';

/** Where the file behind a record is served from. */
export function useFileURL(record: DmsFile): string {
  const {workspaceURI} = useWorkspace();
  return withBasePath(
    `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`,
  );
}
