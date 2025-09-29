import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service11Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import IconProps from '../../types/icons';
import dynamic from 'next/dynamic';

function getIcon(icon: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}
export function Service11(props: TemplateProps<Service11Data>) {
  const {data} = props;
  const {
    service11Caption: caption,
    service11Title: title,
    service11Image,
    service11Services: services,
    service11WrapperClassName: wrapperClassName,
    service11ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: service11Image,
    path: 'service11Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-md-8 col-lg-6 order-lg-2 position-relative">
            <div
              className="shape bg-soft-primary rounded-circle rellax w-20 h-20"
              style={{top: '-2rem', right: '-1.9rem'}}
            />

            <figure className="rounded">
              <img src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-lg mb-8 pe-xxl-2">{caption}</p>

            <div className="row gx-xl-10 gy-6">
              {services?.map(({id, attrs: item}) => {
                const Icon = item.icon && getIcon(item.icon);
                return (
                  <div className="col-md-6 col-lg-12 col-xl-6" key={id}>
                    <ServiceCard3
                      title={item.title}
                      description={item.description}
                      Icon={
                        Icon && (
                          <Icon className="solid icon-svg-sm text-aqua me-5" />
                        )
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
