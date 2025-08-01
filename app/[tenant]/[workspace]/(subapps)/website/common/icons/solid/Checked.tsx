import IconProps from '@/subapps/website/common/types/icons';

const Checked = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256.02"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <path
        className="fill-primary"
        d="M128 64a64 64 0 1064 64 64.06 64.06 0 00-64-64zm34.48 52.59L127.81 154a10.68 10.68 0 01-15.36.29l-18.67-18.71a10.67 10.67 0 1115.08-15.09l10.84 10.83 27.13-29.22a10.68 10.68 0 0115.65 14.53z"
      />

      <path
        className="fill-secondary"
        d="M16 128a111.94 111.94 0 01173.14-93.77L173 50.36A8 8 0 00178.67 64h48a8 8 0 008-8V8A8 8 0 00221 2.36l-20.41 20.42A126.79 126.79 0 00128 0 128 128 0 005.47 165a8 8 0 1015.31-4.61A112.8 112.8 0 0116 128zm234.53-36.94a8 8 0 10-15.31 4.61A112 112 0 01128 240a111 111 0 01-61-18.14l16-16.22A8 8 0 0077.33 192h-48a8 8 0 00-8 8.08l.53 48a8 8 0 0013.68 5.54l20-20.26A126.83 126.83 0 00128 256 127.95 127.95 0 00250.53 91z"
      />
    </svg>
  );
};

export default Checked;
