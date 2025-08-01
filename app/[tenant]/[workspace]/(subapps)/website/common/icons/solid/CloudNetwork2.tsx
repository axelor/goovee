import IconProps from '@/subapps/website/common/types/icons';

const CloudNetwork2 = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <g data-name="Layer 2">
        <g data-name="Layer 1">
          <path
            className="fill-secondary"
            d="M229 204.06a25.63 25.63 0 00-13.31 3.8l-42.34-29.32V128a10.67 10.67 0 00-21.35 0v56.11a10.63 10.63 0 004.59 8.77l46.9 32.48A26.59 26.59 0 00203 230a26 26 0 1026-26zm0 30.61a4.64 4.64 0 114.64-4.64 4.64 4.64 0 01-4.64 4.64zm-90.33-28.25V128a10.67 10.67 0 10-21.34 0v78.42a26 26 0 1021.34 0zM128 234.67a4.64 4.64 0 114.64-4.64 4.64 4.64 0 01-4.64 4.64z"></path>
          <path
            className="fill-primary"
            d="M49.84 172.21l14.1-.18 2.73-1.89V128a26.71 26.71 0 0126.67-26.67 26.41 26.41 0 0117.33 6.57 26.14 26.14 0 0134.66 0 26.53 26.53 0 0144 20.1v42.14l.56.39 16.46-.19a8.5 8.5 0 002.08-.31 65.34 65.34 0 00-9.23-127.65A81 81 0 0049.07 62.91 55.07 55.07 0 000 117.57c0 28.03 21 51.5 49.84 54.64z"></path>
          <path
            className="fill-secondary"
            d="M104 128a10.67 10.67 0 10-21.33 0v50.53l-42.33 29.31A25.91 25.91 0 1053 230a25.68 25.68 0 00-.48-4.67l46.89-32.48a10.63 10.63 0 004.59-8.77V128zM27 234.67a4.64 4.64 0 114.65-4.67 4.64 4.64 0 01-4.65 4.67z"></path>
        </g>
      </g>
    </svg>
  );
};

export default CloudNetwork2;
