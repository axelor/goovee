import type {TemplateProps} from '@/subapps/website/common/types';
import {type About17Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';

export function About17(props: TemplateProps<About17Data>) {
  const {data} = props;
  const {
    about17Title: title,
    about17Caption: caption,
    about17Description: description,
    about17Image,
    about17AboutList: aboutList,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: about17Image,
    path: 'about17Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-3 gy-10 mb-15 mb-md-18 align-items-center">
        <div className="col-lg-5 offset-lg-1">
          <figure>
            <img className="w-auto" src={image} alt="" />
          </figure>
        </div>

        <div className="col-lg-5 offset-lg-1">
          <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
            {caption}
          </h2>
          <h3 className="display-5 mb-4">{title}</h3>
          <p className="mb-6">{description}</p>

          <ListColumn
            list={aboutList?.attrs.list ?? []}
            rowClass={aboutList?.attrs.rowClass}
            bulletColor={aboutList?.attrs.bulletColor}
          />
        </div>
      </div>
    </div>
  );
}
