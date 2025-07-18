import IconProps from '@/subapps/website/common/types/icons';

const Layers = ({className}: IconProps) => {
  return (
    <svg
      viewBox="0 0 256 245.36"
      xmlns="http://www.w3.org/2000/svg"
      className={`svg-inject icon-svg ${className || 'icon-svg-sm solid-duo text-grape-fuchsia mt-md-n10 mb-4'}`}>
      <path
        className="fill-primary"
        d="M128 117.36a7.92 7.92 0 01-3.1-.63L4.9 66.06a8 8 0 010-14.75L124.9.64a7.9 7.9 0 016.22 0l120 50.67a8 8 0 010 14.75l-120 50.67a7.92 7.92 0 01-3.12.63zm123.1 19.29l-12.49-5.28-101.28 42.75a24 24 0 01-18.69 0L17.39 131.36l-12.51 5.28a8 8 0 000 14.75l120 50.67a8.06 8.06 0 006.2 0l120-50.67a8 8 0 000-14.74z"
      />

      <path
        className="fill-secondary"
        d="M251.1 94l-12.49-5.3-101.28 42.75a24 24 0 01-18.69 0L17.39 88.68 4.88 94a8 8 0 000 14.77l120 50.67a7.94 7.94 0 006.2 0l120-50.67a8 8 0 000-14.75zm0 85.31L238.61 174l-101.28 42.78a23.66 23.66 0 01-9.33 1.9 23.91 23.91 0 01-9.36-1.9L17.39 174l-12.51 5.31a8 8 0 000 14.75l120 50.67a7.94 7.94 0 006.2 0l120-50.67a8 8 0 000-14.75z"
      />
    </svg>
  );
};

export default Layers;
