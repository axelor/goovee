import IconProps from '@/subapps/website/common/types/icons';

const VideoChat = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256.02 202.68"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-primary me-4'}`}>
      <g data-name="Layer 2">
        <path
          className="fill-primary"
          d="M245.33 181.33H10.67a10.68 10.68 0 000 21.35h234.67a10.68 10.68 0 100-21.35z"
        />
        <path
          className="fill-primary"
          d="M112 66.66a28.3 28.3 0 001.07 8h-70.4v106.67H21.33V74.66a21.39 21.39 0 0121.33-21.33H112zm122.67 30.51v84.16h-21.33v-81a33.47 33.47 0 0014.93-7.79l5.33 4a3.67 3.67 0 001.07.64z"
        />
        <circle className="fill-primary" cx="117.33" cy="117.33" r="21.33" />
        <path
          className="fill-primary"
          d="M160 178.66v2.67H74.67v-2.67A29.32 29.32 0 01104 149.33h26.67A29.32 29.32 0 01160 178.66z"
        />
        <path
          className="fill-secondary"
          d="M248 85.33a8 8 0 01-4.8-1.6L223.82 69.2a18.67 18.67 0 01-18.49 16.13h-58.67A18.68 18.68 0 01128 66.66V16c0-7.37 4.9-16 18.67-16h58.67A18.69 18.69 0 01224 17.62l18.9-15.76A8 8 0 01256 8v69.33a8 8 0 01-4.42 7.15 7.82 7.82 0 01-3.58.85z"
        />
      </g>
    </svg>
  );
};

export default VideoChat;
