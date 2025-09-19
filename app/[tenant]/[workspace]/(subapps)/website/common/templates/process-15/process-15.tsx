import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process15Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Process15(props: TemplateProps<Process15Data>) {
  const {data} = props;
  const {
    process15Title: title,
    process15Caption: caption,
    process15Image,
    process15Processes: processes,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: process15Image,
    path: 'process15Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 mb-15 mb-md-17 align-items-center">
        <div className="col-lg-7">
          <figure>
            <img className="w-auto" src={image} alt="process" />
          </figure>
        </div>

        <div className="col-lg-5">
          <h3 className="fs-16 text-uppercase text-muted mb-3">{caption}</h3>
          <h3 className="display-5 mb-6">{title}</h3>

          <div className="row gy-4">
            {processes?.map(({id, attrs: item}, i) => (
              <div className="col-md-6" key={id}>
                <h4>
                  <span className="text-primary">{i + 1}.</span> {item.title}
                </h4>
                <p className="mb-0 fs-16">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
