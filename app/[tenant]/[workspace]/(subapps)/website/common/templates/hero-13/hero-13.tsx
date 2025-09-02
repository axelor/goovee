import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero13Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {zoomInAnimate} from '@/subapps/website/common/utils/animation';

export function Hero13(props: TemplateProps<Hero13Data>) {
  const {data} = props;
  const {
    hero13Title: title,
    hero13Caption: caption,
    hero13Video,
    hero13BackgroundImage,
  } = data || {};

  const backgroundImage = getMetaFileURL({
    metaFile: hero13BackgroundImage,
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
      className="wrapper image-wrapper bg-image bg-overlay bg-overlay-300 text-white"
      style={{backgroundImage: `url(${backgroundImage})`}}>
      <div className="container pt-17 pb-19 pt-md-19 pb-md-20 text-center">
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
