import IconProps from '@/subapps/website/common/types/icons';

const DevicesTwo = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 49 40"
      fill="none"
      className={`icon-svg ${className || 'solid text-navy'}`}>
      <path
        d="M9.8 3.73242H34.3C34.9738 3.73242 35.525 4.29229 35.525 4.97656V7.46484H39.2V4.97656C39.2 2.23168 37.0027 0 34.3 0H9.8C7.09734 0 4.9 2.23168 4.9 4.97656V24.8828H1.225C0.55125 24.8828 0 25.4427 0 26.127C0 28.1876 1.64609 29.8594 3.675 29.8594H26.95V24.8828H8.575V4.97656C8.575 4.29229 9.12625 3.73242 9.8 3.73242ZM29.4 13.6855V36.0801C29.4 38.1407 31.0461 39.8125 33.075 39.8125H45.325C47.3539 39.8125 49 38.1407 49 36.0801V13.6855C49 11.6249 47.3539 9.95312 45.325 9.95312H33.075C31.0461 9.95312 29.4 11.6249 29.4 13.6855ZM33.075 13.6855H45.325V36.0801H33.075V13.6855Z"
        // className="fill-primary"
        fill="currentColor"
      />
    </svg>
  );
};

export default DevicesTwo;
