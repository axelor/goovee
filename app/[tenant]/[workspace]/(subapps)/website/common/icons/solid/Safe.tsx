import IconProps from '@/subapps/website/common/types/icons';

const Safe = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <g data-name="Layer 2">
        <path
          className="fill-secondary"
          d="M186.58 19.47l-56-19a8 8 0 00-5.16 0l-56 19A8 8 0 0064 27.06v42.86c0 52.32 58.38 77.73 60.88 78.8a8.1 8.1 0 003.12.64 7.85 7.85 0 003.12-.64c2.5-1.07 60.88-26.5 60.88-78.82V27.06a8 8 0 00-5.42-7.59zm-23.52 40.45l-29.33 37.33a10.67 10.67 0 01-7.35 4h-1a10.7 10.7 0 01-6.94-2.56l-18.67-16a10.66 10.66 0 0113.83-16.11l10.22 8.75 22.47-28.58a10.66 10.66 0 0116.77 13.17z"
        />
        <path
          className="fill-primary"
          d="M237.34 42.67h-24V64h21.33v117.33H21.33V64h21.33V42.67h-24A18.74 18.74 0 000 61.33v144A18.75 18.75 0 0018.66 224h81.69c-1.25 5.34-4.57 14-13.45 22.9a5.33 5.33 0 003.77 9.1h74.67a5.34 5.34 0 003.78-9.1c-8.86-8.87-12.27-17.54-13.6-22.9h81.82A18.75 18.75 0 00256 205.33v-144a18.74 18.74 0 00-18.66-18.66z"
        />
      </g>
    </svg>
  );
};

export default Safe;
