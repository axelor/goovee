import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Hero22Data} from './meta';
import {getImage, getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {zoomInAnimate} from '@/subapps/website/common/utils/animation';

export default function Hero22(props: TemplateProps<Hero22Data>) {
  const {data} = props;
  const {
    hero22Title: title,
    hero22Caption: caption,
    hero22Video,
    hero22BackgroundImage,
    hero22WrapperClassName: wrapperClassName,
    hero22ContainerClassName: containerClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: hero22BackgroundImage,
    path: 'hero22BackgroundImage',
    ...props,
  });

  const videoHref = getMetaFileURL({
    metaFile: hero22Video,
    path: 'hero22Video',
    ...props,
  });
  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className="wrapper image-wrapper bg-cover overflow-hidden position-relative">
        <Image
          src={backgroundImage.url}
          alt={backgroundImage.alt || 'Hero background'}
          fill
          className="object-fit-cover"
        />
        <div
          className="position-absolute top-0 left-0 w-100 h-100 bg-dark opacity-50"
          style={{zIndex: 1}}></div>
        <div
          className="container pt-18 pt-lg-21 pb-17 pb-lg-19 text-center position-relative"
          style={{zIndex: 2}}>
          <div className="row">
            <div className="col-md-9 col-lg-8 col-xl-7 col-xxl-7 mx-auto">
              <h2
                className="h6 text-uppercase ls-xl text-white mb-5"
                style={zoomInAnimate('500ms')}>
                {caption}
              </h2>

              <h3
                className="display-1 fs-54 text-white mb-7"
                style={zoomInAnimate('1000ms')}>
                {title}
              </h3>

              <a
                data-glightbox
                data-type="video"
                href={videoHref}
                className="btn btn-circle btn-white btn-play ripple mx-auto"
                style={zoomInAnimate('1500ms')}>
                <i className="icn-caret-right" />
              </a>
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="divider text-white mx-n2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60">
              <path
                fill="currentColor"
                d="M0,0V60H1440V0A5771,5771,0,0,1,0,0Z"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
