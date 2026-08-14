import React from 'react';

// ---- LOCAL IMPORTS ---- //
import {CSVViewer} from './csv-viewer';
import {HTMLViewer} from './html-viewer';
import {ImageViewer} from './image-viewer';
import {PDFViewer} from './pdf-viewer';
import {TextViewer} from './text-viewer';
import {VideoViewer} from './video-viewer';
import type {DmsFile} from '@/subapps/resources/common/types';

export type FileViewer = React.JSXElementConstructor<{record: DmsFile}>;

/*
 * Which viewer shows which kind of file.
 *
 * Every one of these reads the file from this installation and draws it here.
 * Word processor documents, spreadsheets and presentations are absent on
 * purpose: showing them means sending the address of the file to a service
 * elsewhere, which would both disclose it and fail, since nothing outside holds
 * permission to fetch it. Those remain downloads.
 */
const VIEWERS: Record<string, FileViewer> = {
  'application/pdf': PDFViewer,

  'image/apng': ImageViewer,
  'image/avif': ImageViewer,
  'image/bmp': ImageViewer,
  'image/gif': ImageViewer,
  'image/jpeg': ImageViewer,
  'image/jpg': ImageViewer,
  'image/png': ImageViewer,
  'image/svg+xml': ImageViewer,
  'image/tiff': ImageViewer,
  'image/vnd.microsoft.icon': ImageViewer,
  'image/webp': ImageViewer,
  'image/x-icon': ImageViewer,

  'text/csv': CSVViewer,

  'text/html': HTMLViewer,
  html: HTMLViewer,

  'text/markdown': TextViewer,
  'text/plain': TextViewer,
  'text/xml': TextViewer,
  'application/json': TextViewer,
  'application/xml': TextViewer,

  'video/mp4': VideoViewer,
  'video/ogg': VideoViewer,
  'video/quicktime': VideoViewer,
  'video/webm': VideoViewer,
};

/** The viewer for a kind of file, or null when there is none. */
export function findFileViewer(
  fileType: string | null | undefined,
): FileViewer | null {
  if (!fileType) return null;

  /* A recorded type may carry the character set with it. */
  const [type] = fileType.split(';');
  return VIEWERS[type.trim().toLowerCase()] ?? null;
}
