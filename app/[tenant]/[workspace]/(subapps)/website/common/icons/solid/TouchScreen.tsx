import IconProps from '@/subapps/website/common/types/icons';

const TouchScreen = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 186.69 256"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <path
        className="fill-secondary"
        d="M26.69 83.54V58.66a32 32 0 0164 0V80a31.67 31.67 0 013.25.37A47.94 47.94 0 1010.69 48a47.71 47.71 0 0016 35.54z"></path>
      <path
        className="fill-primary"
        d="M170.69 117.33a16 16 0 00-16 16V136a2.68 2.68 0 01-5.35 0v-13.33a16 16 0 10-32 0V136a2.67 2.67 0 11-5.34 0v-24a16 16 0 00-32 0v24a2.67 2.67 0 11-5.34 0V58.67a16 16 0 00-32 0v96a5.32 5.32 0 01-5.33-5.33V128h-5.27C14.51 128 0 142.16 0 159.71.08 216.05 41.09 256 66.3 256h67.06a53.32 53.32 0 0053.33-53.33v-69.33a16 16 0 00-16-16z"></path>
    </svg>
  );
};

export default TouchScreen;
