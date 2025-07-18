import IconProps from '@/subapps/website/common/types/icons';

const VideoCall = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-primary mb-3'}`}>
      <g data-name="Layer 2">
        <path
          className="fill-secondary"
          d="M256 21.33v160a21.39 21.39 0 01-21.33 21.33H186a55.9 55.9 0 00-55.36-48H128V149a63.52 63.52 0 0016-22.08v27.73h96V29.33A13.33 13.33 0 00226.67 16h-69.33A13.33 13.33 0 00144 29.33v46.72a62.68 62.68 0 00-16-22.19V21.33A21.39 21.39 0 01149.33 0h85.33A21.4 21.4 0 01256 21.33z"
        />
        <path
          className="fill-secondary"
          d="M192 85.33a16 16 0 1116-16 16 16 0 01-16 16zM216 128h-48a8 8 0 01-8-8 24 24 0 0124-24h16a24 24 0 0124 24 8 8 0 01-8 8z"
        />
        <path
          className="fill-primary"
          d="M162.67 256H8a8 8 0 01-8-8v-37.33a40 40 0 0140-40h90.67a40 40 0 0140 40V248a8 8 0 01-8 8zM38.4 91.73a1.8 1.8 0 01.11-.75 48 48 0 0193.76.32c0 .11.11.32.11.43s-.32.11-.43.11C114 96.64 102.4 77.12 102 76.27a5.32 5.32 0 00-3.84-2.56 5.42 5.42 0 00-4.48 1.39c-22.62 21-52.81 17-55.26 16.63z"
        />
        <path
          className="fill-primary"
          d="M126.08 103.25c-14.4 0-24.64-10-29.76-16.43-24.32 19.08-53 16.32-58.88 15.56a21.89 21.89 0 00.21 4.6 48 48 0 0095.36-.32 18.89 18.89 0 00.21-4.28 26.93 26.93 0 01-7.14.87z"
        />
      </g>
    </svg>
  );
};

export default VideoCall;
