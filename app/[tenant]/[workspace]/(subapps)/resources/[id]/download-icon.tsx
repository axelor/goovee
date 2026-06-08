'use client';

import {MdOutlineFileDownload} from 'react-icons/md';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {download} from '@/utils/files';
import {SUBAPP_CODES} from '@/constants';
import type {DmsFile} from '@/subapps/resources/common/types';
import {withBasePath} from '@/lib/core/path/base-path';

export default function DownloadIcon({record}: {record: DmsFile}) {
  const {workspaceURI} = useWorkspace();
  const href = withBasePath(
    `${workspaceURI}/${SUBAPP_CODES.resources}/api/file/${record?.id}`,
  );

  const handleDownload = () => {
    download(record, href);
  };

  return (
    <>
      <MdOutlineFileDownload
        className="h-10 w-10 bg-success-light text-success cursor-pointer"
        onClick={handleDownload}
      />
    </>
  );
}
