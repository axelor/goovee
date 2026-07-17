import {
  MdInsertDriveFile,
  MdPictureAsPdf,
  MdImage,
  MdDescription,
  MdTableChart,
  MdSlideshow,
  MdArticle,
  MdCode,
  MdVideoFile,
  MdAudioFile,
  MdFolder,
} from 'react-icons/md';

import {cn} from '@/utils/css';

// Map a contentType / file extension / metaFile.fileType to (icon, tone color)
export type FileTone =
  | 'red'
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'yellow'
  | 'cyan'
  | 'grey';

export interface FileVisual {
  Icon: React.ComponentType<{className?: string; style?: React.CSSProperties}>;
  tone: FileTone;
}

export function getFileVisual(
  fileType?: string | null,
  fileName?: string | null,
): FileVisual {
  const ext = (
    fileName?.split('.').pop() ??
    fileType?.split('/').pop() ??
    ''
  ).toLowerCase();
  const ct = (fileType ?? '').toLowerCase();

  if (ct.includes('pdf') || ext === 'pdf')
    return {Icon: MdPictureAsPdf, tone: 'red'};

  if (
    ct.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext)
  )
    return {Icon: MdImage, tone: 'purple'};

  if (
    ct.includes('spreadsheet') ||
    ['xlsx', 'xls', 'csv', 'ods'].includes(ext)
  )
    return {Icon: MdTableChart, tone: 'green'};

  if (
    ct.includes('presentation') ||
    ['pptx', 'ppt', 'odp'].includes(ext)
  )
    return {Icon: MdSlideshow, tone: 'orange'};

  if (
    ct.includes('word') ||
    ct.includes('document') ||
    ['doc', 'docx', 'odt'].includes(ext)
  )
    return {Icon: MdDescription, tone: 'blue'};

  if (
    ct.startsWith('text/') ||
    ['txt', 'md', 'rtf'].includes(ext)
  )
    return {Icon: MdArticle, tone: 'grey'};

  if (
    ['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'xml', 'yaml', 'yml'].includes(
      ext,
    ) ||
    ct.includes('javascript') ||
    ct.includes('html')
  )
    return {Icon: MdCode, tone: 'indigo'};

  if (
    ct.startsWith('video/') ||
    ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
  )
    return {Icon: MdVideoFile, tone: 'pink'};

  if (
    ct.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)
  )
    return {Icon: MdAudioFile, tone: 'cyan'};

  return {Icon: MdInsertDriveFile, tone: 'grey'};
}

const TONE_BG: Record<FileTone, string> = {
  red: 'bg-palette-red-light text-palette-red-dark',
  green: 'bg-palette-green-light text-palette-green-dark',
  blue: 'bg-palette-blue-light text-palette-blue-dark',
  orange: 'bg-palette-orange-light text-palette-orange-dark',
  purple: 'bg-palette-purple-light text-palette-purple-dark',
  pink: 'bg-palette-pink-light text-palette-pink-dark',
  indigo: 'bg-palette-indigo-light text-palette-indigo-dark',
  yellow: 'bg-palette-yellow-light text-palette-yellow-dark',
  cyan: 'bg-palette-cyan-light text-palette-cyan-dark',
  grey: 'bg-ink-100 text-ink-600',
};

export function DocFileIcon({
  fileType,
  fileName,
  size = 32,
  rounded = 'md',
  className,
}: {
  fileType?: string | null;
  fileName?: string | null;
  size?: number;
  rounded?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const {Icon, tone} = getFileVisual(fileType, fileName);
  const iconSize = Math.round(size * 0.5);
  const radius =
    rounded === 'sm' ? 'rounded-md' : rounded === 'lg' ? 'rounded-xl' : 'rounded-lg';
  return (
    <span
      className={cn(
        'inline-grid place-items-center shrink-0',
        radius,
        TONE_BG[tone],
        className,
      )}
      style={{width: size, height: size}}>
      <Icon className="" style={{width: iconSize, height: iconSize} as any} />
    </span>
  );
}

const FOLDER_TONE_BG: Record<string, string> = {
  red: 'bg-palette-red-light text-palette-red-dark',
  pink: 'bg-palette-pink-light text-palette-pink-dark',
  purple: 'bg-palette-purple-light text-palette-purple-dark',
  deeppurple: 'bg-palette-purple-light text-palette-purple-dark',
  indigo: 'bg-palette-indigo-light text-palette-indigo-dark',
  blue: 'bg-palette-blue-light text-palette-blue-dark',
  lightblue: 'bg-palette-blue-light text-palette-blue-dark',
  cyan: 'bg-palette-cyan-light text-palette-cyan-dark',
  teal: 'bg-palette-teal-light text-palette-teal-dark',
  green: 'bg-palette-green-light text-palette-green-dark',
  lightgreen: 'bg-palette-green-light text-palette-green-dark',
  lime: 'bg-palette-lime-light text-palette-lime-dark',
  yellow: 'bg-palette-yellow-light text-palette-yellow-dark',
  amber: 'bg-palette-yellow-light text-palette-yellow-dark',
  orange: 'bg-palette-orange-light text-palette-orange-dark',
  deeporange: 'bg-palette-orange-light text-palette-orange-dark',
  brown: 'bg-palette-brown-light text-palette-brown-dark',
  grey: 'bg-ink-100 text-ink-600',
  bluegrey: 'bg-ink-100 text-ink-600',
  black: 'bg-ink-200 text-ink-800',
  white: 'bg-ink-50 text-ink-700',
};

export function getFolderToneClasses(colorSelect?: string | null): string {
  if (!colorSelect) return 'bg-royal-pale text-royal-dark';
  return FOLDER_TONE_BG[colorSelect.toLowerCase()] ?? 'bg-royal-pale text-royal-dark';
}

export function FolderIcon({
  colorSelect,
  size = 32,
  className,
}: {
  colorSelect?: string | null;
  size?: number;
  className?: string;
}) {
  const iconSize = Math.round(size * 0.55);
  return (
    <span
      className={cn(
        'inline-grid place-items-center shrink-0 rounded-lg',
        getFolderToneClasses(colorSelect),
        className,
      )}
      style={{width: size, height: size}}>
      <MdFolder style={{width: iconSize, height: iconSize} as any} />
    </span>
  );
}
