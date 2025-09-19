import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service15Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';

export function Service15(props: TemplateProps<Service15Data>) {
  const {data} = props;
  const {
    service15Title: title,
    service15Caption: caption,
    service15Description: description,
    service15Image,
    service15Services: services,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: service15Image,
    path: 'service15Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center mb-md-15">
        <div className="col-lg-7 order-lg-2">
          <figure>
            <img className="w-auto" src={image} alt="" />
          </figure>
        </div>

        <div className="col-lg-5">
          <h2 className="fs-15 text-uppercase text-primary mb-3">{caption}</h2>
          <h3 className="display-4 mb-5">{title}</h3>
          <p className="mb-6">{description}</p>

          <ListColumn
            list={services?.attrs.list}
            rowClass={services?.attrs.rowClass}
            bulletColor={services?.attrs.bulletColor}
          />
        </div>
      </div>
    </div>
  );
}
