import IconProps from '@/subapps/website/common/types/icons';

const ShoppingBusket = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256.03 256.03"
      className={`svg-inject icon-svg ${className || 'solid-duo text-grape-fuchsia'}`}>
      <path
        className="fill-primary"
        d="M250.58 51.23A24.14 24.14 0 00232 42.7H24a24.11 24.11 0 00-18.54 8.53A23.31 23.31 0 00.34 70.11l28.8 166.4A23.87 23.87 0 0052.82 256h150.4a23.88 23.88 0 0023.68-19.52l28.8-166.4a23.37 23.37 0 00-5.12-18.88zM85.34 202.69a10.67 10.67 0 01-21.34 0V160a10.67 10.67 0 0121.34 0zm53.35 0a10.68 10.68 0 01-21.35 0V160a10.68 10.68 0 0121.35 0zm53.33 0a10.68 10.68 0 01-21.35 0V160a10.68 10.68 0 0121.33 0z"
      />
      <path
        className="fill-secondary"
        d="M74.69 85.36a10.51 10.51 0 01-3.38-.56 10.65 10.65 0 01-6.73-13.49l21.32-64a10.66 10.66 0 1120.23 6.74l-21.33 64a10.65 10.65 0 01-10.11 7.31zm106.65 0a10.67 10.67 0 01-10.11-7.3l-21.33-64a10.66 10.66 0 1120.23-6.73l21.33 64a10.65 10.65 0 01-6.74 13.48 10.77 10.77 0 01-3.38.55z"
      />
    </svg>
  );
};

export default ShoppingBusket;
