import IconProps from '@/subapps/website/common/types/icons';

const Building = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-primary me-4'}`}>
      <g data-name="Layer 2">
        <path
          className="fill-secondary"
          d="M250.58 30.14l-56-19a8 8 0 00-5.16 0l-56 19a8 8 0 00-5.42 7.57v42.87c0 52.32 58.38 77.72 60.88 78.8a8.09 8.09 0 006.26 0c2.48-1.08 60.86-26.48 60.86-78.8V37.71a8 8 0 00-5.42-7.57zm-23.52 40.45l-29.33 37.33a10.66 10.66 0 01-15.33 1.5l-18.67-16a10.66 10.66 0 0113.87-16.19L187.82 86l22.47-28.57a10.66 10.66 0 0116.77 13.18z"
        />
        <path
          className="fill-primary"
          d="M173.87 175.89c-2.56-1.28-5.23-2.67-8-4.37a20.31 20.31 0 018 4.37z"
        />
        <path
          className="fill-primary"
          d="M192 234.67h-24v-22.93a21.33 21.33 0 10-16 0v22.93h-24V149a10.67 10.67 0 10-21.34 0v85.65H85.33V200a8 8 0 00-8-8H50.66a8 8 0 00-8 8v34.67H21.33V69.33H96a10.68 10.68 0 0010.67-10.67V40A18.7 18.7 0 0088 21.31H74.67V10.67a10.67 10.67 0 00-21.34 0v10.67H40A18.69 18.69 0 0021.33 40v8A21.36 21.36 0 000 69.33v176A10.66 10.66 0 0010.67 256H192a10.67 10.67 0 100-21.33z"
        />
        <path
          className="fill-primary"
          d="M77.33 144H50.66a8 8 0 000 16h26.67a8 8 0 000-16zm0-64H50.66a8 8 0 000 16h26.67a8 8 0 000-16zm0 32H50.66a8 8 0 000 16h26.67a8 8 0 000-16z"
        />
      </g>
    </svg>
  );
};

export default Building;
