import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero15Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero15(props: TemplateProps<Hero15Data>) {
  const {data} = props;
  const {hero15Slides: slides = []} = data || {};

  return (
    <div className="wrapper bg-dark">
      <div className="swiper-container swiper-hero dots-over">
        <Carousel
          slidesPerView={1}
          autoplay={{delay: 7000, disableOnInteraction: false}}>
          {slides?.map(({id, attrs: item}, i) => (
            <div
              key={id}
              className="swiper-slide bg-overlay bg-overlay-400 bg-dark bg-image"
              style={{
                backgroundImage: `url(${getMetaFileURL({
                  metaFile: item.image,
                  path: `hero15Slides[${i}].attrs.image`,
                  ...props,
                })})`,
              }}>
              <div className="container h-100">
                <div className="row h-100">
                  <div className="col-md-10 offset-md-1 col-lg-7 offset-lg-0 col-xl-6 col-xxl-5 text-center text-lg-start justify-content-center align-self-center align-items-start">
                    <h2 className="display-1 fs-56 mb-4 text-white animate__animated animate__slideInDown animate__delay-1s">
                      {item.title}
                    </h2>

                    <p className="lead fs-23 lh-sm mb-7 text-white animate__animated animate__slideInRight animate__delay-2s">
                      {item.description}
                    </p>

                    <div className="animate__animated animate__slideInUp animate__delay-3s">
                      {item.buttonLabel && (
                        <NextLink
                          title={item.buttonLabel}
                          href={item.buttonLink}
                          className="btn btn-lg btn-outline-white rounded-pill"
                        />
                      )}
                      {item.video && (
                        <a
                          data-glightbox
                          data-type="video"
                          href={getMetaFileURL({
                            metaFile: item.video,
                            path: `hero15Slides[${i}].attrs.video`,
                            ...props,
                          })}
                          className="btn btn-circle btn-white btn-play ripple mx-auto mb-5">
                          <i className="icn-caret-right" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
}
