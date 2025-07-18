import IconProps from '@/subapps/website/common/types/icons';

const Medal = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 152.88 256"
      className={`svg-inject icon-svg ${className || 'icon-svg-sm solid-duo text-purple-aqua mb-3'}`}>
      <path
        className="fill-primary"
        d="M132.91 110.53l19-73.84A29.28 29.28 0 00123.6 0h-15.15v96.61a89.88 89.88 0 0124.46 13.92zM76.45 90.67a90.68 90.68 0 0116 1.51V0h-32v92.16a90.68 90.68 0 0116-1.49zM20 110.5a90.15 90.15 0 0124.45-13.89V0H29.3A29.25 29.25 0 001 36.66z"
      />
      <path
        className="fill-secondary"
        d="M76.45 106.67a74.67 74.67 0 1074.67 74.66 74.75 74.75 0 00-74.67-74.66zm0 112a37.34 37.34 0 1137.33-37.34 37.38 37.38 0 01-37.33 37.34z"
      />
    </svg>
  );
};

export default Medal;
