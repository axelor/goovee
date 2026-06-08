'use client';

import Image from 'next/image';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {DmsFile} from '@/subapps/resources/common/types';

export default function ImageViewer({record}: {record: DmsFile}) {
  const {workspaceURI} = useWorkspace();

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
      />
    </div>
  );
}
