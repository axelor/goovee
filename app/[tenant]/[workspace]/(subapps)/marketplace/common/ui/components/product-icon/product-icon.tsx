import Icon1 from './icon-1.svg';
import Icon2 from './icon-2.svg';
import Icon3 from './icon-3.svg';
import Icon4 from './icon-4.svg';
import Icon5 from './icon-5.svg';
import Icon6 from './icon-6.svg';
import Icon7 from './icon-7.svg';
import Icon8 from './icon-8.svg';
import Icon9 from './icon-9.svg';
import Icon10 from './icon-10.svg';
import Icon11 from './icon-11.svg';
import Icon12 from './icon-12.svg';

const ICON_COMPONENTS: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  'icon-1': Icon1,
  'icon-2': Icon2,
  'icon-3': Icon3,
  'icon-4': Icon4,
  'icon-5': Icon5,
  'icon-6': Icon6,
  'icon-7': Icon7,
  'icon-8': Icon8,
  'icon-9': Icon9,
  'icon-10': Icon10,
  'icon-11': Icon11,
  'icon-12': Icon12,
};

export interface ProductIconProps {
  code?: string | null;
  className?: string;
}

export function ProductIcon({code, className = 'w-12 h-12'}: ProductIconProps) {
  if (!code) return null;

  const IconComponent = ICON_COMPONENTS[code];
  if (!IconComponent) return null;

  return <IconComponent className={className} />;
}
