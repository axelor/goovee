import {cn} from '@/utils/css';
import {hash} from '../../../../utils/string';

export interface ProductTypeBadgeProps {
  type?: string | null;
  /* Caller-resolved display label. Server callers should resolve via
   * `tattr` (Axelor selection translation); client callers via
   * `i18n.tattr`. */
  label: string;
  className?: string;
}

/* Palette of readable tones, picked deterministically from the type
 * code so each new type gets a stable color without any code change
 * here. Each entry pairs a translucent fill with a saturated foreground
 * — same shape as the Free/Price pill so the two read as siblings on
 * both white cards and the gradient product header. */
const TYPE_PALETTE = [
  'bg-palette-blue-dark/15 text-palette-blue-dark',
  'bg-palette-purple-dark/15 text-palette-purple-dark',
  'bg-palette-teal-dark/15 text-palette-teal-dark',
  'bg-palette-pink-dark/15 text-palette-pink-dark',
  'bg-palette-indigo-dark/15 text-palette-indigo-dark',
  'bg-palette-orange-dark/15 text-palette-orange-dark',
  'bg-palette-green-dark/15 text-palette-green-dark',
  'bg-palette-cyan-dark/15 text-palette-cyan-dark',
  'bg-palette-deeporange-dark/15 text-palette-deeporange-dark',
  'bg-palette-bluegrey-dark/15 text-palette-bluegrey-dark',
] as const;

export function ProductTypeBadge({
  type,
  label,
  className,
}: ProductTypeBadgeProps) {
  if (!type) return null;
  const tone = TYPE_PALETTE[hash(type) % TYPE_PALETTE.length];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        tone,
        className,
      )}>
      {label}
    </span>
  );
}
