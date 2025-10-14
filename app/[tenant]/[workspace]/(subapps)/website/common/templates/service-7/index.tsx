import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service7Data} from './meta';
import ServiceCard3 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard3';
import {Fragment} from 'react';
import IconProps from '../../types/icons';
import dynamic from 'next/dynamic';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export default function Service7(props: TemplateProps<Service7Data>) {
  const {data} = props;
  const {
    service7Caption: caption,
    service7Title: title,
    service7Services: services,
    service7WrapperClassName: wrapperClassName,
    service7ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row text-center">
            <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
              <h2 className="fs-15 text-uppercase text-muted mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-9 ">{title}</h3>
            </div>
          </div>

          <div className="row gx-lg-8 gx-xl-12 gy-8">
            {services?.map(({id, attrs: item}) => {
              const Icon = getIcon(item.icon);
              return (
                <div className="col-md-6 col-lg-4" key={id}>
                  <ServiceCard3
                    title={item.title}
                    description={item.description}
                    Icon={<Icon />}
                  />
                </div>
              );
            })}
          </div>
        </Fragment>
      </div>
    </section>
  );
}
