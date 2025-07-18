import IconProps from '@/subapps/website/common/types/icons';

const Calendar = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <path
        className="fill-secondary"
        d="M66.67 117.33H40a8 8 0 00-8 8V152a8 8 0 008 8h26.67a8 8 0 008-8v-26.67a8 8 0 00-8-8zm0 64H40a8 8 0 00-8 8V216a8 8 0 008 8h26.67a8 8 0 008-8v-26.67a8 8 0 00-8-8zm74.66-64h-26.67a8 8 0 00-8 8V152a8 8 0 008 8h26.67a8 8 0 008-8v-26.67a8 8 0 00-8-8zm0 64h-26.67a8 8 0 00-8 8V216a8 8 0 008 8h26.67a8 8 0 008-8v-26.67a8 8 0 00-8-8zm74.67-64h-26.67a8 8 0 00-8 8V152a8 8 0 008 8H216a8 8 0 008-8v-26.67a8 8 0 00-8-8z"
      />

      <path
        className="fill-primary"
        d="M224 32H32A32 32 0 000 64v160a32 32 0 0032 32h192a32 32 0 0032-32V64a32 32 0 00-32-32zm10.67 192A10.67 10.67 0 01224 234.67H32A10.67 10.67 0 0121.33 224V107.09h213.33V224z"
      />

      <path
        className="fill-secondary"
        d="M64 0H53.33a10.67 10.67 0 00-10.67 10.67v42.67A10.68 10.68 0 0053.33 64H64a10.67 10.67 0 0010.67-10.66V10.67A10.67 10.67 0 0064 0zm138.67 0H192a10.67 10.67 0 00-10.67 10.67v42.67A10.67 10.67 0 00192 64h10.67a10.67 10.67 0 0010.67-10.67V10.67A10.67 10.67 0 00202.67 0z"
      />
    </svg>
  );
};

export default Calendar;
