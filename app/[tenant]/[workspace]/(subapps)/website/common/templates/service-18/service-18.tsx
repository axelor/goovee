import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service18Data} from './meta';
import dynamic from 'next/dynamic';
import IconProps from '../../types/icons';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Service18(props: TemplateProps<Service18Data>) {
  const {data} = props;
  const {
    service18Caption: caption,
    service18Description: description,
    service18Services1: services1,
    service18Services2: services2,
  } = data || {};

  return (
    <section className="wrapper bg-light wrapper-border">
      <div className="container py-14 py-md-18">
        <div className="row gx-lg-8 gx-xl-12 gy-6 mb-10">
          <div className="col-lg-6 order-lg-2">
            <ul className="progress-list">
              {services1?.map(({id, attrs: item}) => (
                <li key={id}>
                  <p>{item.title}</p>
                  <div
                    className={`progressbar line ${item.color}`}
                    data-value={item.percent}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-3">{caption}</h2>
            <p className="lead fs-20 mb-5">{description}</p>
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-6 text-center">
          {services2?.map(({id, attrs: item}) => {
            const Icon = item.icon && getIcon(item.icon);
            return (
              <div className="col-md-6 col-lg-3" key={id}>
                {Icon && (
                  <Icon className="solid icon-svg-md text-violet mb-3" />
                )}
                <h4>{item.title}</h4>
                <p className="mb-2">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
