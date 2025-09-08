import {FC, ReactElement} from 'react';

// ================================================
type ServiceCard3Props = {
  title?: string;
  Icon?: ReactElement;
  className?: string;
  description?: string;
};
// ================================================

const ServiceCard3: FC<ServiceCard3Props> = props => {
  const {title, description, Icon, className = 'd-flex flex-row'} = props;
  return (
    <div className={className}>
      <div>{Icon}</div>

      <div>
        <h4 className="mb-1">{title}</h4>
        <p className="mb-0">{description}</p>
      </div>
    </div>
  );
};

export default ServiceCard3;
