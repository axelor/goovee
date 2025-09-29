import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero24Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Hero24(props: TemplateProps<Hero24Data>) {
  const {data} = props;
  const {
    hero24Images: images,
    hero24SectionClassName: sectionClassName,
    hero24WrapperClassName: wrapperClassName,
    hero24ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section id="home" className={sectionClassName} data-code={props.code}>
      <div className={wrapperClassName}>
        <div className={containerClassName}>
          <div className="swiper-container swiper-auto">
            <Carousel
              className="overflow-visible"
              grabCursor
              slidesPerView="auto"
              centeredSlides
              loop>
              {images?.map(({id, attrs: item}, i) => (
                <figure className="rounded" key={id}>
                  <img
                    src={getMetaFileURL({
                      metaFile: item.image,
                      path: `hero24Images[${i}].attrs.image`,
                      ...props,
                    })}
                    alt=""
                  />
                  <a
                    className="item-link"
                    href={getMetaFileURL({
                      metaFile: item.image,
                      path: `hero24Images[${i}].attrs.image`,
                      ...props,
                    })}
                    data-glightbox
                    data-gallery="gallery-group">
                    <i className="uil uil-focus-add" />
                  </a>
                </figure>
              ))}
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
