import {FC, ReactElement} from 'react';

// ==================================================================================
type ServiceCardProps = {
  title?: string;
  cardColor?: string;
  Icon?: ReactElement<any>;
  columnClass?: string;
  description?: string;
};
// ==================================================================================

const ServiceCard4: FC<ServiceCardProps> = props => {
  const {title, Icon, cardColor, columnClass, description} = props;

  return (
    <div className={columnClass}>
      <div className={`card ${cardColor}`}>
        <div className="card-body">
          {Icon}
          <h4>{title}</h4>
          <p className="mb-0">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard4;
