import IconProps from '@/subapps/website/common/types/icons';

const Wallet = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256 234.67"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-primary me-4'}`}>
      <path
        className="fill-secondary"
        d="M184.21 42.75L161.57 4a8 8 0 00-4.91-3.76 8.1 8.1 0 00-6.12.9L81.31 42.66z"
      />
      <path
        className="fill-primary"
        d="M32 53.33A10.67 10.67 0 0132 32h36l35.63-21.33H32A32 32 0 00.53 37.33 10.9 10.9 0 000 40v162.67a32.09 32.09 0 0032 32h181.33a21.39 21.39 0 0021.33-21.32V192H208a48 48 0 110-96h26.67V74.69a21.39 21.39 0 00-21.33-21.33H32zM202.67 32a21.3 21.3 0 00-18.45-21.12l18.45 31.79z"
      />
      <path
        className="fill-secondary"
        d="M248 112h-40a32 32 0 000 64h40a8 8 0 008-8v-48a8 8 0 00-8-8zm-40 42.66A10.67 10.67 0 11218.67 144 10.68 10.68 0 01208 154.66z"
      />
    </svg>
  );
};

export default Wallet;
