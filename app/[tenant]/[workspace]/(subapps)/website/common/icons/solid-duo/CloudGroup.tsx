import IconProps from '@/subapps/website/common/types/icons';

const CloudGroup = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 234.66"
      className={`svg-inject icon-svg solid-duo ${className || 'icon-svg-sm text-grape-fuchsia me-3'}`}>
      <circle className="fill-secondary" cx="128" cy="149.33" r="21.33" />
      <path
        className="fill-secondary"
        d="M162.67 234.66H93.34a8 8 0 01-8-8v-16a29.36 29.36 0 0129.33-29.33h26.67a29.35 29.35 0 0129.33 29.33v16a8 8 0 01-8 8zm32-64h-14.19a55.46 55.46 0 0116.85 40v2.67H216a8.06 8.06 0 008-8V200a29.32 29.32 0 00-29.33-29.34zm-133.34 0A29.31 29.31 0 0032 200v5.35a8.06 8.06 0 008 8h18.67v-2.67a55.46 55.46 0 0116.85-40z"
      />
      <circle className="fill-secondary" cx="74.67" cy="138.66" r="21.33" />
      <circle className="fill-secondary" cx="181.33" cy="138.66" r="21.33" />
      <path
        className="fill-primary"
        d="M27.2 162.94a52.21 52.21 0 018.8-6.56A42.48 42.48 0 01107.73 112a41 41 0 0140.54 0A42.48 42.48 0 01220 156.38a55.09 55.09 0 015.83 4 64.4 64.4 0 00-26.65-118.49A81.31 81.31 0 00128 0C90.19 0 57.39 26.3 49.1 62.18 21.54 65.07 0 88.22 0 116.26c0 19.93 11 37.21 27.2 46.68z"
      />
    </svg>
  );
};

export default CloudGroup;
