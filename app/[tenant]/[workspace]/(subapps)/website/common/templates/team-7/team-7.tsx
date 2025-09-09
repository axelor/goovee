import type {TemplateProps} from '@/subapps/website/common/types';
import {type Team7Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';

export function Team7(props: TemplateProps<Team7Data>) {
  const {data} = props;
  const {
    team7Caption: caption,
    team7Title: title,
    team7Description: description,
    team7Image,
    team7List: list,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: team7Image,
    path: 'team7Image',
    ...props,
  });

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 mb-14 mb-md-17 align-items-center">
        <div className="col-md-8 col-lg-6 order-lg-2">
          <figure className="rounded">
            <img src={image} alt="" />
          </figure>
        </div>

        <div className="col-lg-6">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-3 mb-5">{title}</h3>
          <p className="mb-6">{description}</p>

          <ListColumn
            list={list?.attrs.list ?? []}
            rowClass={list?.attrs.rowClass || 'gx-xl-8'}
            bulletColor={list?.attrs.bulletColor}
          />
        </div>
      </div>
    </div>
  );
}
