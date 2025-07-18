import IconProps from '@/subapps/website/common/types/icons';

const Alarm = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 255.98 256"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-primary me-4'}`}>
      <path
        className="fill-secondary"
        d="M26.64 256a10.66 10.66 0 01-8.26-17.4l23.33-28.67a10.67 10.67 0 1116.55 13.47l-23.33 28.67a10.65 10.65 0 01-8.29 3.93zm202.69 0a10.65 10.65 0 01-8.29-3.93l-23.33-28.67a10.67 10.67 0 0116.55-13.47l23.32 28.67a10.66 10.66 0 01-8.25 17.4zM10.66 72a10.66 10.66 0 01-7.54-18.2L53.79 3.13a10.67 10.67 0 0115.09 15.08L18.21 68.88A10.68 10.68 0 0110.66 72zm234.65 0a10.55 10.55 0 01-7.53-3.12L187.1 18.21a10.67 10.67 0 1115.09-15.08l50.67 50.67a10.66 10.66 0 01-7.55 18.2z"
      />
      <path
        className="fill-primary"
        d="M128 32a112 112 0 10112 112A112.12 112.12 0 00128 32zm66.68 122.68H128A10.68 10.68 0 01117.31 144V80a10.68 10.68 0 0121.35 0v53.33h56a10.68 10.68 0 010 21.35z"
      />
    </svg>
  );
};

export default Alarm;
