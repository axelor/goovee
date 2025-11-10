import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero13Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {zoomInAnimate} from '@/subapps/website/common/utils/animation';

export default function Hero13(props: TemplateProps<Hero13Data>) {
  const {data} = props;
  const {
    hero13Title: title,
    hero13Caption: caption,
    hero13Video,
    hero13BackgroundImage,
    hero13WrapperClassName: wrapperClassName,
    hero13ContainerClassName: containerClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: hero13BackgroundImage,
    path: 'hero13BackgroundImage',
    ...props,
  });

  const videoHref = getMetaFileURL({
    metaFile: hero13Video,
    path: 'hero13Video',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${backgroundImage.url})`}}>
      <div className={containerClassName}>
        <div className="row mb-11">
          <div className="col-md-9 col-lg-7 col-xxl-6 mx-auto">
            <h2
              className="h6 text-uppercase ls-xl text-white mb-5"
              style={zoomInAnimate('0ms')}>
              {caption}
            </h2>

            <h3
              className="display-1 text-white mb-7"
              style={zoomInAnimate('500ms')}>
              {title}
            </h3>

            <a
              data-glightbox
              data-type="video"
              href={videoHref}
              className="btn btn-circle btn-white btn-play ripple mx-auto mb-5"
              style={zoomInAnimate('1000ms')}>
              <i className="icn-caret-right" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
