import IconProps from '@/subapps/website/common/types/icons';

const BullHorn = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 218.67"
      className={`svg-inject icon-svg ${className || 'solid text-fuchsia'}`}>
      <path
        className="fill-secondary"
        d="M88 208a48.06 48.06 0 01-48-48 45.85 45.85 0 012.26-14.48 10.66 10.66 0 1120.22 6.75 24.28 24.28 0 00-1.15 7.73 26.65 26.65 0 0052.56 6.22 10.67 10.67 0 0120.77 4.87A47.71 47.71 0 0188 208z"
      />

      <path
        className="fill-primary"
        d="M248 210.67a8 8 0 01-2.22-.32L5.78 141A8 8 0 010 133.34v-48a8 8 0 015.78-7.68l240-69.32A8 8 0 01256 16v186.7a8 8 0 01-3.2 6.4 8.09 8.09 0 01-4.8 1.57z"
      />

      <path
        className="fill-primary"
        d="M245.33 218.67A10.67 10.67 0 01234.66 208V10.67a10.67 10.67 0 1121.34 0V208a10.66 10.66 0 01-10.67 10.67zm-234.66-64A10.66 10.66 0 010 144V74.69a10.67 10.67 0 0121.34 0V144a10.67 10.67 0 01-10.67 10.67z"
      />
    </svg>
  );
};

export default BullHorn;
