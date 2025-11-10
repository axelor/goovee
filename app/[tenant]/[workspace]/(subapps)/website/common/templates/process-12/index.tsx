import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process12Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import ServiceCard3 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard3';

export default function Process12(props: TemplateProps<Process12Data>) {
  const {data} = props;
  const {
    process12Caption: caption,
    process12Heading: heading,
    process12Para1: para1,
    process12Para2: para2,
    process12LinkTitle: linkTitle,
    process12LinkHref: linkHref,
    process12Processes: processes,
    process12WrapperClassName: wrapperClassName,
    process12ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-5">{heading}</h3>
            <p>{para1}</p>

            <p className="mb-6">{para2}</p>

            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-primary rounded-pill mb-0"
            />
          </div>

          <div className="col-lg-6">
            {processes?.map(({id, attrs: item}) => (
              <ServiceCard3
                key={id}
                title={item.title}
                description={item.subtitle}
                className={`d-flex flex-row ${item.className}`}
                Icon={
                  <span
                    className={`icon btn btn-block btn-lg btn-${item.color} pe-none mt-1 me-5`}>
                    <span className="number fs-22">{item.no}</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
