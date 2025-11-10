import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero23Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel2 from '@/subapps/website/common/components/reuseable/Carousel2';

export default function Hero23(props: TemplateProps<Hero23Data>) {
  const {data} = props;
  const {
    hero23Title: title,
    hero23Caption: caption,
    hero23SlideImages: slideImages,
    hero23WrapperClassName: wrapperClassName,
    hero23ContainerClassName: containerClassName,
  } = data || {};

  const slides = slideImages?.map((item, i) => ({
    image: getImage({
      image: item.attrs.image,
      path: `hero23SlideImages[${i}].attrs.image`,
      ...props,
    }),
    thumb: getImage({
      image: item.attrs.thumb,
      path: `hero23SlideImages[${i}].attrs.thumb`,
      ...props,
    }),
  }));

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className="swiper-container swiper-thumbs-container swiper-fullscreen nav-dark">
        <Carousel2 slides={slides || []} />

        <div className="swiper-static">
          <div className={containerClassName}>
            <div className="row">
              <div className="col-lg-8 mx-auto mt-n10 text-center">
                <h1 className="fs-19 text-uppercase ls-xl text-white mb-3 animate__animated animate__zoomIn animate__delay-1s">
                  {caption}
                </h1>
                <h2 className="display-1 fs-60 text-white mb-0 animate__animated animate__zoomIn animate__delay-2s">
                  {title}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
