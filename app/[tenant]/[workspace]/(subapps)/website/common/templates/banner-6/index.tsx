import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner6Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';

export default function Banner6(props: TemplateProps<Banner6Data>) {
  const {data} = props;
  const {
    banner6Video,
    banner6Image,
    banner6WrapperClassName: wrapperClassName,
    banner6ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: banner6Image,
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
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image.url})`}}>
      <div className={containerClassName}>
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
