import IconProps from '@/subapps/website/common/types/icons';

const Director = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg solid-duo ${className || 'icon-svg-sm text-grape-fuchsia me-4'}`}>
      <path
        className="fill-primary"
        d="M163.78 19.12A42.63 42.63 0 00128 0c-18.54 0-34.77 11.81-40.14 28.34C74.26 31 64 42.66 64 56.53c0 15.89 13.42 28.8 29.92 28.8h63.3c19.18 0 34.78-15 34.78-33.43 0-16.22-12.08-29.87-28.22-32.78z"
      />
      <path
        className="fill-secondary"
        d="M224 168a8 8 0 01-8-8v-16H40v16a8 8 0 01-16 0v-24a8 8 0 018-8h192a8 8 0 018 8v24a8 8 0 01-8 8z"
      />
      <path
        className="fill-secondary"
        d="M128 170.67a8 8 0 01-8-8v-48a8 8 0 0116 0v48a8 8 0 01-8 8z"
      />
      <circle className="fill-primary" cx="32" cy="197.33" r="16" />
      <path
        className="fill-primary"
        d="M40 224H24a24 24 0 00-24 24 8 8 0 008 8h48a8 8 0 008-8 24 24 0 00-24-24z"
      />
      <circle className="fill-primary" cx="128" cy="197.33" r="16" />
      <path
        className="fill-primary"
        d="M136 224h-16a24 24 0 00-24 24 8 8 0 008 8h48a8 8 0 008-8 24 24 0 00-24-24z"
      />
      <circle className="fill-primary" cx="224" cy="197.33" r="16" />
      <path
        className="fill-primary"
        d="M232 224h-16a24 24 0 00-24 24 8 8 0 008 8h48a8 8 0 008-8 24 24 0 00-24-24z"
      />
    </svg>
  );
};

export default Director;
