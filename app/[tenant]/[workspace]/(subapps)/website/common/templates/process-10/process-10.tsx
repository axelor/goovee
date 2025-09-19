import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process10Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {ProcessList2} from '@/subapps/website/common/components/reuseable/process-list';

export function Process10(props: TemplateProps<Process10Data>) {
  const {data} = props;
  const {
    process10Title: title,
    process10Image,
    process10Processes: processes,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: process10Image,
    path: 'process10Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 mb-14 mb-md-17 align-items-center">
        <div className="col-lg-7">
          <figure>
            <img className="w-auto" src={image} alt="" />
          </figure>
        </div>

        <div className="col-lg-5">
          <h3 className="display-4 mb-7">{title}</h3>
          {processes?.map(item => (
            <ProcessList2
              key={item.id}
              no={item.attrs.no}
              title={item.attrs.title}
              subtitle={item.attrs.subtitle}
              className="icon btn btn-circle btn-soft-primary pe-none me-5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
