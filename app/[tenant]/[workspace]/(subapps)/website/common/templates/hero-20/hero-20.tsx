import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero20Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Hero20(props: TemplateProps<Hero20Data>) {
  const {data} = props;
  const {
    hero20Title: title,
    hero20Description: description,
    hero20Video,
    hero20Poster,
    hero20WrapperClassName: wrapperClassName,
    hero20ContainerClassName: containerClassName,
  } = data || {};

  const poster = getImage({
    image: hero20Poster,
    path: 'hero20Poster',
    ...props,
  });

  const videoSrc = getMetaFileURL({
    metaFile: hero20Video,
    path: 'hero20Video',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <video
        loop
        muted
        autoPlay
        playsInline
        src={videoSrc}
        poster={poster.url}
      />

      <div className="video-content">
        <div className={containerClassName}>
          <div className="row">
            <div className="col-lg-8 col-xl-6 text-center text-white mx-auto">
              <h1 className="display-1 fs-54 text-white mb-5">
                <span className="rotator-zoom">{title}</span>
              </h1>

              <p className="lead fs-24 mb-0">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
