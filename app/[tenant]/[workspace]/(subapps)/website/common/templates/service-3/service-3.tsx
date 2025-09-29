import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service3Data} from './meta';
import {ServiceCard2} from '@/subapps/website/common/components/reuseable/service-cards';
import {Fragment} from 'react';

export function Service3(props: TemplateProps<Service3Data>) {
  const {data} = props;
  const {
    service3Title: title,
    service3Caption: caption,
    service3Services: services,
    service3WrapperClassName: wrapperClassName,
    service3ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row">
            <div className="col-md-10 col-lg-8 col-xl-7 col-xxl-6 mx-auto text-center">
              <h2 className="fs-15 text-uppercase text-muted mb-3 ">{title}</h2>
              <h3 className="display-4 mb-5 mb-10">{caption}</h3>
            </div>
          </div>

          <div className="row gx-md-8 gy-8 text-center mb-14 mb-md-17">
            {services?.map(({id, attrs: item}) => (
              <ServiceCard2
                key={id}
                title={item.title}
                linkUrl={item.linkUrl}
                linkTitle={item.linkTitle}
                icon={`uil-${item.icon}`}
                description={item.description}
              />
            ))}
          </div>
        </Fragment>
      </div>
    </section>
  );
}
