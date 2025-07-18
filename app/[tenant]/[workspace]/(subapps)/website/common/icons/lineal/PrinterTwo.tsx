import IconProps from '@/subapps/website/common/types/icons';

const PrinterTwo = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'icon-svg-xs solid-mono text-primary mx-2'}`}>
      <path
        className="fill-secondary"
        d="M181.33 0H74.66a32 32 0 00-32 32v42.67a10.67 10.67 0 0021.34 0V32a10.67 10.67 0 0110.67-10.67H182.4a9.6 9.6 0 019.6 9.6v43.73a10.67 10.67 0 0021.34 0V32a32 32 0 00-32.01-32z"
      />
      <path
        className="fill-primary"
        d="M226.67 64H29.33A29.32 29.32 0 000 93.33v69.33A29.32 29.32 0 0029.33 192H64v-32h128v32h34.67A29.32 29.32 0 00256 162.67V93.34A29.32 29.32 0 00226.67 64z"
      />
      <path
        className="fill-secondary"
        d="M202.66 138.66H53.33a10.66 10.66 0 00-10.67 10.67V224a32 32 0 0032 32h106.67a32 32 0 0032-32v-74.67a10.68 10.68 0 00-10.67-10.67zm-40 85.34H93.34a8 8 0 010-16h69.33a8 8 0 010 16zm0-32H93.34a8 8 0 010-16h69.33a8 8 0 010 16z"
      />
    </svg>
  );
};

export default PrinterTwo;
