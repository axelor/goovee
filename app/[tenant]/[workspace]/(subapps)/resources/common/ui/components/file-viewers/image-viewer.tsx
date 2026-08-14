'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {DmsFile} from '@/subapps/resources/common/types';

export function ImageViewer({record}: {record: DmsFile}) {
  const {workspaceURI} = useWorkspace();

  /*
   * A vector image is one file at every size, so it is asked for as it is. The
   * address of a file carries no extension for the size to be left off by the
   * usual rule, and asking for a width anyway would offer the browser a set of
   * candidates that are all the same file, held separately for each width.
   */
  const vector = record?.metaFile?.fileType === 'image/svg+xml';

  return (
    <div className="container">
      <Image
        className="object-cover max-w-100 w-full h-auto"
        src={withBasePath(
          `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`,
        )}
        alt="Viewer"
        width={0}
        height={0}
        sizes="100vw"
        unoptimized={vector}
      />
    </div>
  );
}
