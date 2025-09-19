import {FC, HTMLAttributes} from 'react';
import IconBox from '../IconBox';
import NextLink from '../links/NextLink';

// ================================================
type ServiceCard2Props = {
  icon?: string;
  title?: string;
  linkTitle?: string;
  linkUrl?: string;
  description?: string;
  titleColor?: string;
  hiddenBtn?: boolean;
  iconBoxClassNames?: HTMLAttributes<HTMLDivElement>['className'];
};
// ================================================

const ServiceCard2: FC<ServiceCard2Props> = props => {
  const {
    title,
    linkUrl,
    linkTitle,
    description,
    icon,
    iconBoxClassNames = 'icon btn btn-circle btn-lg btn-primary pe-none mb-5',
    titleColor,
    hiddenBtn,
  } = props;

  return (
    <div className="col-md-6 col-lg-3">
      <IconBox icon={icon} className={iconBoxClassNames} />
      <h4 className={titleColor}>{title}</h4>
      <p className="mb-3 fs-15">{description}</p>
      {!hiddenBtn && (
        <NextLink title={linkTitle} href={linkUrl} className="more hover" />
      )}
    </div>
  );
};

export default ServiceCard2;
