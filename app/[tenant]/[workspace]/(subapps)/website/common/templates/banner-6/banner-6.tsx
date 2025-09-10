import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Banner6(props: TemplateProps<Banner6Data>) {
  const {data} = props;
  const {banner6Video, banner6Image} = data || {};

  const image = getMetaFileURL({
    metaFile: banner6Image,
    path: 'banner6Image',
    ...props,
  });

  const video = getMetaFileURL({
    metaFile: banner6Video,
    path: 'banner6Video',
    ...props,
  });

  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay"
      style={{backgroundImage: `url(${image})`}}>
      <div className="container py-18 text-center">
        <div className="row">
          <div className="col-lg-10 col-xl-10 col-xxl-8 mx-auto">
            <a
              href={video}
              data-type="video"
              data-glightbox
              className="btn btn-circle btn-white btn-play ripple mx-auto mb-5">
              <i className="icn-caret-right" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
