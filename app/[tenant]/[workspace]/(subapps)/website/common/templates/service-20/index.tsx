import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service20Data} from './meta';
import {Fragment} from 'react';
import IconProps from '../../types/icons';
import dynamic from 'next/dynamic';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export default function Service20(props: TemplateProps<Service20Data>) {
  const {data} = props;
  const {
    service20Caption: caption,
    service20Description: description,
    service20Services: services,
    service20WrapperClassName: wrapperClassName,
    service20ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row text-center">
            <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2">
              <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
                {caption}
              </h2>
              <h3 className="display-4 mb-9 px-xl-14">{description}</h3>
            </div>
          </div>

          <div className="row gy-8">
            {services?.map(({id, attrs: item}) => {
              const Icon = item.icon && getIcon(item.icon);
              return (
                <div className="col-md-6 col-lg-4" key={id}>
                  <div className="d-flex flex-row">
                    <div>
                      {Icon && (
                        <Icon className="solid icon-svg-sm text-fuchsia me-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="fs-22 mb-1">{item.title}</h3>
                      <p className="mb-0">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Fragment>
      </div>
    </section>
  );
}
