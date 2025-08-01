import IconProps from '@/subapps/website/common/types/icons';

const Code = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 255.98 213.34"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-md text-grape mb-5'}`}>
      <g>
        <g>
          <path
            className="fill-secondary"
            d="M104,213.34a11,11,0,0,1-2.59-.32,10.64,10.64,0,0,1-7.76-12.93l48-192a10.66,10.66,0,0,1,20.68,5.17l-48,192A10.66,10.66,0,0,1,104,213.34Z"
          />
          <path
            className="fill-primary"
            d="M74.66,181.34a10.57,10.57,0,0,1-7.54-3.12l-64-64a10.67,10.67,0,0,1,0-15.08l64-64A10.67,10.67,0,0,1,82.21,50.22L25.75,106.69l56.46,56.46a10.65,10.65,0,0,1-7.55,18.19Z"
          />
          <path
            className="fill-primary"
            d="M181.31,181.34a10.55,10.55,0,0,1-7.53-3.12,10.67,10.67,0,0,1,0-15.08l56.46-56.47L173.78,50.21a10.67,10.67,0,1,1,15.08-15.09l64,64a10.68,10.68,0,0,1,0,15.09l-64,64A10.58,10.58,0,0,1,181.31,181.34Z"
          />
        </g>
      </g>
    </svg>
  );
};

export default Code;
