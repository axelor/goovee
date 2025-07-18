import IconProps from '@/subapps/website/common/types/icons';

const Script = ({className}: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256.02 213.34"
      className={`svg-inject icon-svg solid-duo ${className || 'icon-svg-sm text-grape-fuchsia me-4'}`}>
      <path
        className="fill-secondary"
        d="M162.66 106.34a8 8 0 01-6.06-13.2l11.54-13.47-11.54-13.45a8 8 0 1112.14-10.42l16 18.67a8 8 0 010 10.42l-16 18.67a8 8 0 01-6.08 2.78zm-69.31 0a8 8 0 01-6.08-2.78l-16-18.67a8 8 0 010-10.42l16-18.67a8 8 0 0112.15 10.42L87.88 79.67l11.54 13.46a8 8 0 01-6.07 13.21zm24.87 15.8a8 8 0 01-6-9.6l16-69.33a8 8 0 1115.6 3.6l-16 69.33a8 8 0 01-9.6 6z"
      />
      <path
        className="fill-primary"
        d="M237.33 0H18.67A18.76 18.76 0 000 18.67v144a18.76 18.76 0 0018.67 18.67h81.68c-1.25 5.35-4.57 14-13.45 22.9a5.33 5.33 0 003.77 9.1h74.67a5.33 5.33 0 003.78-9.1c-8.86-8.86-12.27-17.54-13.6-22.9h81.82A18.77 18.77 0 00256 162.67v-144A18.79 18.79 0 00237.33 0zm-2.66 138.67H21.33V21.34h213.33v117.33z"
      />
    </svg>
  );
};

export default Script;
