import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero24Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Hero24(props: TemplateProps<Hero24Data>) {
  const {data} = props;
  const {
    hero24Images: images = [],
    hero24WrapperClassName: wrapperClassName = 'bg-gray overflow-hidden',
    hero24ContainerClassName: containerClassName = 'px-xl-0 pt-6 pb-10',
  } = data || {};

  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="swiper-container swiper-auto">
          <Carousel
            className="overflow-visible"
            grabCursor
            slidesPerView="auto"
            centeredSlides
            loop>
            {images?.map(({id, attrs: item}, i) => {
              const image = getMetaFileURL({
                metaFile: item.image,
                path: `hero24Images[${i}].attrs.image`,
                ...props,
              });
              return (
                <figure className="rounded" key={id}>
                  <img src={image} alt="" />
                  <a
                    className="item-link"
                    href={image}
                    data-type="image"
                    data-glightbox
                    data-gallery="gallery-group">
                    <i className="uil uil-focus-add" />
                  </a>
                </figure>
              );
            })}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
