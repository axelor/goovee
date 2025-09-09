import {FC, HTMLAttributes} from 'react';
import IconBox from '../IconBox';
import NextLink from '../links/NextLink';

// ================================================
type ServiceCard6Props = {
  icon?: string;
  title?: string;
  linkUrl?: string;
  linkTitle?: string;
  description?: string;
  iconBoxClassNames?: HTMLAttributes<HTMLDivElement>['className'];
};
// ================================================

const ServiceCard6: FC<ServiceCard6Props> = props => {
  const {
    title,
    linkUrl,
    linkTitle,
    description,
    icon,
    iconBoxClassNames = 'icon btn btn-circle btn-lg btn-primary pe-none mb-5',
  } = props;

  return (
    <div className="col-md-6 col-lg-3">
      <div className="card">
        <div className="card-body">
          <IconBox icon={icon} className={iconBoxClassNames} />
          <h4>{title}</h4>
          <p className="mb-3">{description}</p>
          <NextLink title={linkTitle} href={linkUrl} className="more hover" />
        </div>
      </div>
    </div>
  );
};

export default ServiceCard6;
