import IconProps from '@/subapps/website/common/types/icons';

const RocketTwo = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 255.99 256.01"
      className={`svg-inject icon-svg ${className || 'icon-svg-xs solid-mono text-primary mx-2'}`}>
      <path
        className="fill-primary"
        d="M250.75 0c-50-.89-107 25.22-143 65.75a135.36 135.36 0 00-92.77 39.5 5.32 5.32 0 003 9.07L59 120.23l-5 5.68a5.34 5.34 0 00.2 7.33l68.56 68.56a5.32 5.32 0 007.33.21l5.68-5.08 5.86 41.07a5.31 5.31 0 003.78 4.11 4.88 4.88 0 001.52.24 6.06 6.06 0 004.12-1.71 135 135 0 0039.16-92.42c40.57-36.14 66.89-93.12 65.74-143a5.33 5.33 0 00-5.2-5.2zM201.6 92.1a26.66 26.66 0 110-37.71 26.57 26.57 0 010 37.71z"
      />
      <path
        className="fill-secondary"
        d="M29.05 180.31C17.63 191.72 2 243.3.22 249.14A5.36 5.36 0 005.33 256a5.41 5.41 0 001.53-.23c5.84-1.74 57.41-17.42 68.83-28.85a33 33 0 00-46.64-46.62z"
      />
    </svg>
  );
};

export default RocketTwo;
