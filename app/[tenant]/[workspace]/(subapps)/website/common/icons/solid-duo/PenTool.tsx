import IconProps from '@/subapps/website/common/types/icons';

const PenTool = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'icon-svg-sm solid-duo text-purple-aqua mt-1 me-4'}`}>
      <g data-name="Layer 2">
        <path
          className="fill-primary"
          d="M162.62 162.53l17.14-27.87a10.65 10.65 0 00.8-9.6L137.89 20a10.68 10.68 0 00-19.78 0L75.44 125.06a10.71 10.71 0 00.8 9.6l17.14 27.87a18.56 18.56 0 00-9.2 13.68L74.74 247a7.94 7.94 0 007.93 9h90.67a8 8 0 007.92-9.07l-9.44-70.74a18.56 18.56 0 00-9.2-13.66zm-45.29-83.91v28.05a10.67 10.67 0 1021.34 0v-28l20.08 49.46L139.14 160h-22.29l-19.62-31.92z"
        />
        <path
          className="fill-secondary"
          d="M248 0h-26.67a8 8 0 00-8 8v2.67H42.66V8a8 8 0 00-8-8H8a8 8 0 00-8 8v26.67a8 8 0 008 8h26.67a8 8 0 008-8V32h19.84a111.78 111.78 0 00-46.38 88.24 21.32 21.32 0 1021.33.13 90.58 90.58 0 01181.1 0 21.33 21.33 0 1021.33-.13A111.84 111.84 0 00193.5 32h19.84v2.67a8 8 0 008 8H248a8 8 0 008-8V8a8 8 0 00-8-8z"
        />
      </g>
    </svg>
  );
};

export default PenTool;
