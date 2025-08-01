import IconProps from '@/subapps/website/common/types/icons';

const Lock = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 192 256"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <path
        className="fill-primary"
        d="M168 96H24a24 24 0 00-24 24v112a24 24 0 0024 24h144a24 24 0 0024-24V120a24 24 0 00-24-24z"
      />
      <path
        className="fill-secondary"
        d="M160 64v32h-21.33V64a42.67 42.67 0 10-85.34 0v32H32V64a64 64 0 01128 0z"
      />
    </svg>
  );
};

export default Lock;
