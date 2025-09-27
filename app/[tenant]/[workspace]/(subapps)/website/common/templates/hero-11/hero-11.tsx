import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero11Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {slideInDownAnimate} from '@/subapps/website/common/utils/animation';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero11(props: TemplateProps<Hero11Data>) {
  const {data} = props;
  const {
    hero11Title: title,
    hero11Description: description,
    hero11ButtonLabel1: buttonLabel1,
    hero11ButtonLabel2: buttonLabel2,
    hero11ButtonLink1: buttonLink1,
    hero11ButtonLink2: buttonLink2,
    hero11BackgroundImage,
    hero11VideoHref: videoHref,
    hero11CarouselImages: carouselImages = [],
  } = data || {};

  const backgroundImage = getMetaFileURL({
    metaFile: hero11BackgroundImage,
    path: 'hero11BackgroundImage',
    ...props,
  });

  const courouselElements = carouselImages?.map(({id, attrs: item}, i) => (
    <img
      key={id}
      alt=""
      className="rounded"
      src={getMetaFileURL({
        metaFile: item.image,
        path: `hero11CarouselImages[${i}].attrs.image`,
        ...props,
      })}
    />
  ));

  if (videoHref) {
    courouselElements.push(
      <div>
        <a
          data-glightbox
          data-type="video"
          data-gallery="hero"
          href={videoHref}
          className="btn btn-circle btn-white btn-play ripple mx-auto mb-5 position-absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 3,
          }}>
          <i className="icn-caret-right" />
        </a>
      </div>,
    );
  }

  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay bg-overlay-400 bg-content text-white"
      style={{backgroundImage: `url(${backgroundImage})`}}>
      <div className="container pt-18 pb-16">
        <div className="row gx-0 gy-12 align-items-center">
          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-6 content text-center text-lg-start">
            <h1
              className="display-2 mb-5 text-white"
              style={slideInDownAnimate('600ms')}>
              {title}
            </h1>

            <p
              className="lead fs-lg lh-sm mb-7 pe-xl-10"
              style={slideInDownAnimate('900ms')}>
              {description}
            </p>

            <div className="d-flex justify-content-center justify-content-lg-start">
              <span style={slideInDownAnimate('1200ms')}>
                <NextLink
                  title={buttonLabel1}
                  href={buttonLink1}
                  className="btn btn-lg btn-white rounded-pill me-2"
                />
              </span>

              <span style={slideInDownAnimate('1500ms')}>
                <NextLink
                  title={buttonLabel2}
                  href={buttonLink2}
                  className="btn btn-lg btn-outline-white rounded-pill"
                />
              </span>
            </div>
          </div>

          <div className="col-lg-5 offset-lg-1">
            <div className="swiper-container dots-over shadow-lg">
              <Carousel grabCursor navigation={false} slidesPerView={1}>
                {courouselElements}
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
