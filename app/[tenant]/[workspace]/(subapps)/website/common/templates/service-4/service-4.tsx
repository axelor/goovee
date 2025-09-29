import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service4Data} from './meta';
import {ServiceCard2} from '@/subapps/website/common/components/reuseable/service-cards';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Service4(props: TemplateProps<Service4Data>) {
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
          <div className="col-md-10 col-lg-8 col-xl-7 col-xxl-6 mx-auto text-center">
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-10">{title}</h3>
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-11">
          {services?.map(({id, attrs: item}, i) => (
            <div className="col-md-6 col-lg-4" key={id}>
              <ServiceCard2
                title={item.title}
                linkUrl={item.linkUrl}
                description={item.description}
                icon={getMetaFileURL({
                  metaFile: item.icon,
                  path: `service4Services[${i}].attrs.icon`,
                  ...props,
                })}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}