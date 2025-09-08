import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process6Data} from './meta';
import {Fragment} from 'react';

export function Process6(props: TemplateProps<Process6Data>) {
  const {data} = props;
  const {
    process6Title: title,
    process6Caption: caption,
    process6Processes: processes,
  } = data || {};

  return (
    <div className="container">
      <Fragment>
        <h2 className="display-4 mb-3">{title}</h2>
        <p className="lead fs-lg mb-8">{caption}</p>

        <div className="row gx-lg-8 gx-xl-12 gy-6 process-wrapper line">
          {processes?.map(({id, attrs: item}, i) => {
            const iconColor = i === 1 ? 'btn-primary' : 'btn-soft-primary';

            return (
              <div className="col-md-6 col-lg-3" key={id}>
                <span
                  className={`icon btn btn-circle btn-lg pe-none mb-4 ${iconColor}`}>
                  <span className="number">{item.no}</span>
                </span>

                <h4 className="mb-1">{item.title}</h4>
                <p>{item.subtitle}</p>
              </div>
            );
          })}
        </div>
      </Fragment>
    </div>
  );
}
