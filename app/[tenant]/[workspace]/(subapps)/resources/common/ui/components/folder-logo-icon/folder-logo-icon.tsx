import * as MdIcons from 'react-icons/md';
import * as BsIcons from 'react-icons/bs';
import {MdFolder} from 'react-icons/md';
import type {IconType} from 'react-icons';

// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {getFolderToneClasses} from '../doc-file-icon';

/**
 * Resolves the back-office folder icon (`logoSelect`) the same way the
 * pre-redesign portal did: `md-*` / `bs-*` keys map to a react-icons
 * component. Kept in a **server-only** module so the full icon set never
 * lands in a client bundle (unlike the deprecated <DynamicIcon>).
 */
const iconMap: Record<string, IconType> = {
  ...Object.fromEntries(
    Object.entries(MdIcons).map(([key, val]) => [`md-${key.slice(2)}`, val]),
  ),
  ...Object.fromEntries(
    Object.entries(BsIcons).map(([key, val]) => [`bs-${key.slice(2)}`, val]),
  ),
} as Record<string, IconType>;

export function FolderLogoIcon({
  logoSelect,
  colorSelect,
  size = 44,
  className,
}: {
  logoSelect?: string | null;
  colorSelect?: string | null;
  size?: number;
  className?: string;
}) {
  // Use the configured icon when known, otherwise fall back to a plain folder.
  const Icon = (logoSelect && iconMap[logoSelect]) || MdFolder;
  const iconSize = Math.round(size * 0.55);
  return (
    <span
      className={cn(
        'inline-grid place-items-center shrink-0 rounded-lg',
        getFolderToneClasses(colorSelect),
        className,
      )}
      style={{width: size, height: size}}>
      <Icon style={{width: iconSize, height: iconSize}} />
    </span>
  );
}

export default FolderLogoIcon;
