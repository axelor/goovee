import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process5Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import dynamic from 'next/dynamic';

function getIcon(icon: string) {
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Process5(props: TemplateProps<Process5Data>) {
  const {data} = props;
  const {
    process5Title: title,
    process5Caption: caption,
    process5Description: description,
    process5Image,
    process5Processes: processes,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: process5Image,
    path: 'process5Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-10 mb-lg-19 mb-xl-22 align-items-center">
        <div className="col-lg-6">
          <figure>
            <img alt="how it work" src={image} />
          </figure>
        </div>

        <div className="col-lg-6">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4 mb-5">{title}</h3>
          <p className="mb-8">{description}</p>

          <div className="row gy-6 gx-xxl-8 process-wrapper">
            {processes?.map(({id, attrs: item}) => {
              const Icon = item.icon && getIcon(item.icon);
              return (
                <div className="col-md-4" key={id}>
                  {Icon && <Icon />}
                  <h4 className="mb-1">{item.title}</h4>
                  <p className="mb-0">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
