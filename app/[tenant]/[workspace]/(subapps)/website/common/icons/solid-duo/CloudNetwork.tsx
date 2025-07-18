import IconProps from '@/subapps/website/common/types/icons';

const CloudNetwork = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256.03 256.02"
      className={`svg-inject icon-svg solid-duo ${className || 'icon-svg-sm text-grape-fuchsia me-4'}`}>
      <path
        className="fill-primary"
        d="M193.17 36.14C180.21 14.05 155.12 0 128 0 93.52 0 63.55 22.64 55.62 53.65c-25.27 2.75-44.95 23.09-44.95 47.68 0 26.46 22.79 48 50.79 48h123.6c33.24 0 60.28-25.52 60.28-56.9 0-28.67-22.57-52.62-52.17-56.29z"
      />
      <path
        className="fill-secondary"
        d="M245.34 208h-74.67v-8A18.69 18.69 0 00152 181.33h-13.33V144a10.67 10.67 0 10-21.34 0v37.33H104A18.69 18.69 0 0085.33 200v8H10.66a10.67 10.67 0 000 21.34h74.68v8A18.7 18.7 0 00104 256h48a18.7 18.7 0 0018.67-18.68v-8h74.67a10.67 10.67 0 100-21.34z"
      />
    </svg>
  );
};

export default CloudNetwork;
