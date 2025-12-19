import {FC, ReactElement} from 'react';
import NextLink from './NextLink';

// =========================================================
type ListItemLinkProps = {
  href: string;
  liClassName?: string;
  linkClassName?: string;
  title: string | ReactElement<any>;
  onClick?: () => void;
};
// =========================================================

const ListItemLink: FC<ListItemLinkProps> = props => {
  const {
    linkClassName = 'nav-link',
    liClassName = 'nav-item',
    href,
    title,
    onClick,
  } = props;

  return (
    <li className={liClassName} onClick={onClick}>
      <NextLink className={linkClassName} href={href} title={title} />
    </li>
  );
};

export default ListItemLink;
