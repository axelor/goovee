import IconProps from '@/subapps/website/common/types/icons';

const Edit = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      className={`svg-inject icon-svg solid-mono ${className || 'icon-svg-sm text-fuchsia mb-3'}`}>
      <path
        className="fill-primary"
        d="M152 0H29.33A29.32 29.32 0 000 29.33v165.33A29.32 29.32 0 0029.33 224h78.72l2.35-13.12a29.71 29.71 0 018.11-15.68l62.83-62.72V29.33A29.33 29.33 0 00152 0zM42.67 42.67h42.67a10.67 10.67 0 110 21.33H42.66a10.67 10.67 0 010-21.33zM96 149.33H42.67a10.67 10.67 0 110-21.33H96a10.67 10.67 0 110 21.33zm42.67-42.66h-96a10.67 10.67 0 010-21.34h96a10.67 10.67 0 110 21.34z"
      />
      <path
        className="fill-secondary"
        d="M133.63 256a8 8 0 01-7.89-9.38l5.67-32.06a8 8 0 012.22-4.27l79.2-79.2c9.73-9.75 19.28-7.12 24.51-1.89l13.2 13.2a18.69 18.69 0 010 26.4l-79.2 79.2a7.83 7.83 0 01-4.27 2.22l-32 5.67a10.71 10.71 0 01-1.44.11zm32.05-13.65z"
      />
    </svg>
  );
};

export default Edit;
