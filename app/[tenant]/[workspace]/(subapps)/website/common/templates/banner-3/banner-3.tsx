import type {TemplateProps} from '@/subapps/website/common/types';
import {type Banner3Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Banner3(props: TemplateProps<Banner3Data>) {
  const {data} = props;
  const {
    banner3Heading: heading,
    banner3Image,
    banner3Video,
    banner3WrapperClassName: wrapperClassName,
    banner3ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: banner3Image,
    path: 'banner3Image',
    ...props,
  });

  const video = getMetaFileURL({
    metaFile: banner3Video,
    path: 'banner3Video',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image})`}}>
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
            <h2 className="display-4 px-lg-10 px-xl-13 px-xxl-10 mb-10 text-white">
              {heading}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}
