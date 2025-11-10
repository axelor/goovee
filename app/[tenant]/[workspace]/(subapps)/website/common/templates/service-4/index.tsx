import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service4Data} from './meta';
import ServiceCard2 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard2';

export default function Service4(props: TemplateProps<Service4Data>) {
  const {data} = props;
  const {
    service4Title: title,
    service4Caption: caption,
    service4Services: services,
    service4WrapperClassName: wrapperClassName,
    service4ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-8 col-xl-7 col-xxl-6">
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {title}
            </h2>
            <h3 className="display-4 mb-9">{caption}</h3>
          </div>
        </div>

        <div className="row gx-md-8 gy-8">
          {services?.map(({id, attrs: item}) => (
            <ServiceCard2
              key={id}
              title={item.title}
              linkUrl={item.linkUrl}
              linkTitle={item.linkTitle}
              icon={item.icon}
              description={item.description}
              iconBoxClassNames={item.iconBoxClassNames}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
