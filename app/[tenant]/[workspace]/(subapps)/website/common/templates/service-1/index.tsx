import ServiceCard1 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard1';
// -------- data -------- //
import Design from '@/subapps/website/common/icons/solid/Design';
import dynamic from 'next/dynamic';
import {TemplateProps} from '@/subapps/website/common/types';

import type {Service1Data} from './meta';

function getIcon(icon?: string) {
  return icon
    ? dynamic(() =>
        import(`@/subapps/website/common/icons/solid/${icon}`).catch(err => {
          return Design;
        }),
      )
    : Design;
}

export default function Service1(props: TemplateProps<Service1Data>) {
  const {data} = props;
  const {
    service1Title: title,
    service1Caption: caption,
    service1Services: services,
    service1WrapperClassName: wrapperClassName,
    service1ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-10 px-xl-12">{title}</h3>
          </div>
        </div>

        <div className="position-relative">
          <div
            className="shape rounded-circle bg-soft-blue rellax w-16 h-16"
            style={{zIndex: 0, right: '-2.2rem', bottom: '-0.5rem'}}
          />

          <div
            className="shape bg-dot primary rellax w-16 h-17"
            style={{zIndex: 0, top: '-0.5rem', left: '-2.2rem'}}
          />

          <div className="row gx-md-5 gy-5 text-center">
            {services?.map(({id, attrs: item}) => (
              <ServiceCard1
                key={id}
                Icon={getIcon(item.icon)}
                title={item.title}
                linkUrl={item.link}
                linkType={item.linkType}
                description={item.description}
                iconClassName="icon-svg-sm solid text-navy"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
