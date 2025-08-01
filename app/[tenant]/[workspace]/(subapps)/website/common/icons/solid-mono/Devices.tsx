import IconProps from '@/subapps/website/common/types/icons';

const Devices = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-md text-grape mb-5'}`}>
      <g>
        <g>
          <path
            className="fill-primary"
            d="M226.67,0H80A29.35,29.35,0,0,0,50.67,29.33V42.66H72v-8A13.34,13.34,0,0,1,85.33,21.33h136a13.34,13.34,0,0,1,13.33,13.33V221.33a13.35,13.35,0,0,1-13.33,13.33H138.59A44.07,44.07,0,0,1,132.7,256h94A29.33,29.33,0,0,0,256,226.67V29.33A29.35,29.35,0,0,0,226.67,0Z"
          />
          <path
            className="fill-secondary"
            d="M97.17,64h-77C9,64,0,73.87,0,86V234c0,12.13,9,22,20.16,22h77c11.12,0,20.16-9.87,20.16-22V86C117.33,73.87,108.29,64,97.17,64Zm5.5,168c0,4.42-3.28,8-7.33,8H22c-4.05,0-7.33-3.58-7.33-8V85.33c0-4.42,3.28-8,7.33-8h3.66c4.05,0,7.33,3.58,7.33,8s3.28,8,7.33,8H77c4.05,0,7.33-3.59,7.33-8s3.28-8,7.33-8h3.66c4,0,7.33,3.58,7.33,8V232Z"
          />
          <path
            className="fill-primary"
            d="M154.67,186.67A13.33,13.33,0,1,0,168,200,13.35,13.35,0,0,0,154.67,186.67Z"
          />
        </g>
      </g>
    </svg>
  );
};

export default Devices;
