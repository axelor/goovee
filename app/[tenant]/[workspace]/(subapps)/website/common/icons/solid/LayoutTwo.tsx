import IconProps from '@/subapps/website/common/types/icons';

const LayoutTwo = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'solid text-green'}`}>
      <path
        className="fill-secondary"
        d="M0 102.4v141.87A11.73 11.73 0 0011.73 256h51.2a11.73 11.73 0 0011.73-11.73V102.4a11.73 11.73 0 00-11.73-11.73h-51.2A11.73 11.73 0 000 102.4z"
      />
      <path
        className="fill-primary"
        d="M244.27 0H11.73A11.73 11.73 0 000 11.73v51.2a11.73 11.73 0 0011.73 11.73h232.53A11.72 11.72 0 00256 62.93v-51.2A11.7 11.7 0 00244.27 0zM102.4 256h141.87A11.73 11.73 0 00256 244.27V102.4a11.73 11.73 0 00-11.73-11.73H102.4a11.73 11.73 0 00-11.73 11.73v141.87A11.73 11.73 0 00102.4 256z"
      />
    </svg>
  );
};

export default LayoutTwo;
