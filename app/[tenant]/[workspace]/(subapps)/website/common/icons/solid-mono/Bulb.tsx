import IconProps from '@/subapps/website/common/types/icons';

const Bulb = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 255.98"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-fuchsia me-4'}`}>
      <circle className="fill-primary" cx="58.67" cy="149.31" r="32" />
      <path
        className="fill-primary"
        d="M88 202.65H29.33A29.36 29.36 0 000 232v16a8 8 0 008 8h101.33a8 8 0 008-8v-16A29.36 29.36 0 0088 202.65z"
      />
      <circle className="fill-primary" cx="197.33" cy="149.31" r="32" />
      <path
        className="fill-primary"
        d="M226.67 202.65H168A29.36 29.36 0 00138.67 232v16a8 8 0 008 8H248a8 8 0 008-8v-16a29.36 29.36 0 00-29.33-29.35z"
      />
      <path
        className="fill-secondary"
        d="M149.76 108.48v7.68A11.9 11.9 0 01137.81 128h-19.63c-5.76 0-12-4.27-12-13.76v-5.76zM176 47.68a47.26 47.26 0 01-17.6 36.91 22.89 22.89 0 00-8.32 13.23H106a20 20 0 00-7.79-12.69A47.13 47.13 0 0180 46.73C80.53 21.34 101.76.33 127.25 0a47.34 47.34 0 0134.56 13.88A46.82 46.82 0 01176 47.68z"
      />
    </svg>
  );
};

export default Bulb;
