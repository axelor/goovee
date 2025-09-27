import {FC, HTMLAttributes} from 'react';

// ====================================================
type IconBoxProps = {
  icon?: string;
  className?: HTMLAttributes<HTMLDivElement>['className'];
};
// ====================================================

const IconBox: FC<IconBoxProps> = ({icon, className}) => {
  return (
    <div className={className}>
      <i className={`uil ${icon}`} />
    </div>
  );
};

export default IconBox;
