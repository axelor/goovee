'use client';

// ---- LOCAL IMPORTS ---- //
import {useFileURL} from './use-file-url';
import type {DmsFile} from '@/subapps/resources/common/types';

/*
 * The browser plays the file straight from its address, asking for the parts it
 * needs as it goes, so playback starts without waiting for the whole recording
 * and seeking does not fetch it again from the beginning.
 */
export function VideoViewer({record}: {record: DmsFile}) {
  const url = useFileURL(record);

  return (
    <div className="flex justify-center bg-black">
      <video
        controls
        preload="metadata"
        className="max-h-[70vh] w-full"
        src={url}
      />
    </div>
  );
}
