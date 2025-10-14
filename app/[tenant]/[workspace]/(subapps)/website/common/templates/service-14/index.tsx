import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service14Data} from './meta';
import ServiceCard6 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard6';
import {Fragment} from 'react';

export default function Service14(props: TemplateProps<Service14Data>) {
  const {data} = props;
  const {
    service14Caption: caption,
    service14Title: title,
    service14Services: services,
    service14WrapperClassName: wrapperClassName,
    service14ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row text-center">
            <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
              <h2 className="fs-15 text-uppercase text-primary mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-10 px-xl-10">{title}</h3>
            </div>
          </div>

          <div className="position-relative">
            <div
              className="shape rounded-circle bg-soft-primary rellax w-16 h-16"
              style={{bottom: '-0.5rem', right: '-2.5rem', zIndex: 0}}
            />
            <div
              className="shape bg-dot primary rellax w-16 h-17"
              style={{top: '-0.5rem', left: '-2.5rem', zIndex: 0}}
            />

            <div className="row gx-md-5 gy-5 text-center">
              {services?.map(({id, attrs: item}) => (
                <ServiceCard6
                  key={id}
                  title={item.title}
                  icon={`uil-${item.icon}`}
                  description={item.description}
                  linkUrl={item.linkUrl}
                  linkTitle={item.linkTitle}
                />
              ))}
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
