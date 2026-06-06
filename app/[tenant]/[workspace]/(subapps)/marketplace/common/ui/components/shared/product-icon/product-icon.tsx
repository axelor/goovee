import {cn} from '@/utils/css';
import {MARKETPLACE_ICON_MAP} from '../../../../constants/icons';

export interface ProductIconProps {
  code: string | null;
  className?: string;
}

export function ProductIcon({code, className = 'w-12 h-12'}: ProductIconProps) {
  if (!code) return null;

  const IconComponent = MARKETPLACE_ICON_MAP[code];
  if (!IconComponent) return null;

  /* react-icons inherit `currentColor`. Default to the grey the previous
   * hand-drawn SVGs used; callers can override via a `text-*` class (twMerge
   * lets the caller's color win). */
  return <IconComponent className={cn('text-[#5A605F]', className)} />;
}
