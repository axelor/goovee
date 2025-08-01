import IconProps from '@/subapps/website/common/types/icons';

const Team = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 255.98 256"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-md text-grape mb-5'}`}>
      <g>
        <g>
          <circle className="fill-primary" cx="128" cy="26.67" r="26.67" />
          <circle className="fill-primary" cx="202.67" cy="176" r="26.67" />
          <circle className="fill-primary" cx="53.33" cy="176" r="26.67" />
          <path
            className="fill-primary"
            d="M173.33,106.67H82.66a8,8,0,0,1-8-8V93.34A29.35,29.35,0,0,1,104,64h48a29.35,29.35,0,0,1,29.33,29.32v5.33A8,8,0,0,1,173.33,106.67Z"
          />
          <path
            className="fill-primary"
            d="M248,256H157.33a8,8,0,0,1-8-8v-5.33a29.36,29.36,0,0,1,29.33-29.33h48A29.36,29.36,0,0,1,256,242.67V248A8,8,0,0,1,248,256Z"
          />
          <path
            className="fill-primary"
            d="M98.67,256H8a8,8,0,0,1-8-8v-5.33a29.36,29.36,0,0,1,29.33-29.33h48a29.37,29.37,0,0,1,29.33,29.33V248a8,8,0,0,1-8,8Z"
          />
          <path
            className="fill-secondary"
            d="M29.33,136.13a8,8,0,0,1-8-8A107.1,107.1,0,0,1,83.06,31.36a8,8,0,1,1,6.73,14.51,91,91,0,0,0-52.48,82.26A8,8,0,0,1,29.33,136.13Z"
          />
          <path
            className="fill-secondary"
            d="M226.67,136.13a8,8,0,0,1-8-8,91,91,0,0,0-52.48-82.26,8,8,0,1,1,6.74-14.51,107.09,107.09,0,0,1,61.73,96.77,8,8,0,0,1-8,8Z"
          />
          <path
            className="fill-secondary"
            d="M128,234.8a105.08,105.08,0,0,1-11.15-.58,8,8,0,0,1,1.66-15.9,93.73,93.73,0,0,0,19.6-.06,8,8,0,0,1,1.76,15.9,110.68,110.68,0,0,1-11.87.64Z"
          />
        </g>
      </g>
    </svg>
  );
};

export default Team;
