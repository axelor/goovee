import IconProps from '@/subapps/website/common/types/icons';

const Search = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 234.67"
      className={`svg-inject icon-svg ${className || 'solid text-navy'}`}>
      <path
        className="fill-secondary"
        d="M117.15 74.85a53.33 53.33 0 1053.33 53.33 53.39 53.39 0 00-53.33-53.33zm0 85.33a32 32 0 1132-32 32 32 0 01-32 32z"
      />
      <path
        className="fill-secondary"
        d="M149.7 149.68a10.61 10.61 0 017.53 3.12l31.65 31.65a10.67 10.67 0 01-15.09 15.09l-31.65-31.65a10.67 10.67 0 017.56-18.21z"
      />
      <path
        className="fill-primary"
        d="M224 0H32A32 32 0 000 32v170.67a32 32 0 0032 32h192a32 32 0 0032-32V32a32 32 0 00-32-32zm0 213.33H32a10.68 10.68 0 01-10.67-10.67V53.33h213.33v149.33A10.67 10.67 0 01224 213.33z"
      />
    </svg>
  );
};

export default Search;
