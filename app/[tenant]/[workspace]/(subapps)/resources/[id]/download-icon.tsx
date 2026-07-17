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
    <button
      type="button"
      onClick={handleDownload}
      aria-label="Download"
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-royal text-white hover:bg-royal-dark transition-colors shadow-[0_1px_2px_rgba(13,30,75,0.15),0_4px_12px_rgba(13,30,75,0.12)] text-sm font-semibold">
      <MdOutlineFileDownload className="h-5 w-5" />
      <span className="hidden sm:inline">Download</span>
    </button>
  );
}
