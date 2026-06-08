'use client';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {SUBAPP_CODES} from '@/constants';
import {DocViewer} from '@/ui/components';
import {withBasePath} from '@/lib/core/path/base-path';

// ---- LOCAL IMPORTS ---- //
import type {DmsFile} from '@/subapps/resources/common/types';

export default function PDFViewer({record}: {record: DmsFile}) {
  const {workspaceURI} = useWorkspace();

  return (
    <DocViewer
      documents={[
        {
          uri: withBasePath(
            `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`,
          ),
        },
      ]}
    />
  );
}
