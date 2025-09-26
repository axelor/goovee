import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service25Data} from './meta';
import {Fragment} from 'react';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Service25(props: TemplateProps<Service25Data>) {
  const {data} = props;
  const {
    service25Caption: caption,
    service25Title: title,
    service25Services: services,
    service25WrapperClassName: wrapperClassName,
    service25ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row text-center">
            <div className="col-lg-9 col-xl-8 mx-auto">
              <h2 className="fs-16 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-10 px-xxl-10">{title}</h3>
            </div>
          </div>

          <div className="row">
            <div className="col-xxl-11 mx-auto">
              <div className="row gx-lg-8 gx-xl-12 gy-11 text-center d-flex align-items-end">
                {services?.map(({id, attrs: item}) => (
                  <div className="col-sm-8 col-md-6 col-lg-4 mx-auto" key={id}>
                    <div className="px-md-3 px-lg-0 px-xl-3">
                      <div
                        className={`icon btn btn-block btn-lg btn-${item.iconColor} pe-none mb-5`}>
                        <i className={`uil uil-${item.icon}`} />
                      </div>
                      <h3 className="fs-22">{item.title}</h3>
                      <p className="mb-2">{item.description}</p>
                      <NextLink
                        title="Learn More"
                        href={item.linkUrl}
                        className={`more hover link-${item.linkColor}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
