import IconProps from '@/subapps/website/common/types/icons';

const Headphone = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 244.09"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-xs text-green me-4'}`}>
      <path
        className="fill-secondary"
        d="M35.72 92.28a92.28 92.28 0 01184.56 0v47.63a8.93 8.93 0 01-17.86 0V92.28a74.42 74.42 0 10-148.84 0v47.63a8.93 8.93 0 11-17.86 0zm175.63 62.51a8.93 8.93 0 018.93 8.93v35.72a32.75 32.75 0 01-32.75 32.75h-35.72a8.94 8.94 0 010-17.87h35.72a14.88 14.88 0 0014.89-14.88v-35.72a8.93 8.93 0 018.93-8.93z"
      />
      <path
        className="fill-secondary"
        d="M107.16 223.26A20.84 20.84 0 01128 202.42h11.91a20.84 20.84 0 010 41.67H128a20.84 20.84 0 01-20.84-20.83zm20.84-3a3 3 0 100 5.95h11.91a3 3 0 000-5.95z"
      />
      <path
        className="fill-primary"
        d="M32.74 107.16A32.74 32.74 0 000 139.91v23.81a32.75 32.75 0 0032.74 32.75h11.91a8.93 8.93 0 008.93-8.94v-71.44a8.93 8.93 0 00-8.93-8.93zm190.52 0A32.74 32.74 0 01256 139.91v23.81a32.75 32.75 0 01-32.74 32.75h-11.91a8.93 8.93 0 01-8.93-8.94v-71.44a8.93 8.93 0 018.93-8.93z"
      />
    </svg>
  );
};

export default Headphone;
