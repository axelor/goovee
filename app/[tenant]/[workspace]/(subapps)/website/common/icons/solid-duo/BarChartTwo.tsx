import IconProps from '@/subapps/website/common/types/icons';

const BarChartTwo = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256 245.34"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-duo ${className || 'icon-svg-sm text-grape-fuchsia mb-3'}`}>
      <path
        className="fill-secondary"
        d="M32 106.67A10.67 10.67 0 0124.91 88l48-42.67a10.62 10.62 0 018.37-2.61l83 10.07 47-44.56A10.66 10.66 0 01226 23.74l-50.67 48a10.73 10.73 0 01-8.61 2.85L83.49 64.5 39.09 104a10.61 10.61 0 01-7.09 2.7z"
      />
      <path
        className="fill-secondary"
        d="M226.67 53.34A8 8 0 01221 51l-37.32-37.34A8 8 0 01189.33 0h37.33a8 8 0 018 8v37.33a8 8 0 01-4.95 7.39 7.66 7.66 0 01-3.04.62z"
      />
      <path
        className="fill-primary"
        d="M74.67 184v29.33h-64V184A13.33 13.33 0 0124 170.67h37.33A13.34 13.34 0 0174.67 184zM160 120v93.33H96V120a13.33 13.33 0 0113.33-13.33h37.33A13.33 13.33 0 01160 120zm85.33 21.34v72h-64v-72A13.32 13.32 0 01194.66 128H232a13.31 13.31 0 0113.33 13.34z"
      />
      <path
        className="fill-secondary"
        d="M248 245.34H8a8 8 0 010-16h240a8 8 0 010 16z"
      />
    </svg>
  );
};

export default BarChartTwo;
