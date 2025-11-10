import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio1Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export default function Portfolio1(props: TemplateProps<Portfolio1Data>) {
  const {data} = props;
  const {
    portfolio1Caption: caption,
    portfolio1Description: description,
    portfolio1Images: images = [],
    portfolio1WrapperClassName: wrapperClassName,
    portfolio1ContainerClassName: containerClassName,
  } = data || {};

  const carouselBreakpoints = {
    0: {slidesPerView: 1},
    768: {slidesPerView: 2},
    992: {slidesPerView: 3},
  };

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="col-lg-9 col-xl-8 mx-auto text-center">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4 mb-10">{description}</h3>
        </div>
      </div>
      <div className="container-fluid px-md-6">
        <div className="swiper-container blog grid-view mb-17 mb-md-19">
          <Carousel grabCursor breakpoints={carouselBreakpoints}>
            {images?.map(({id, attrs: item}, i) => (
              <figure className="rounded" key={id}>
                {(() => {
                  const img = getImage({
                    image: item.image,
                    path: `portfolio1Images[${i}].attrs.image`,
                    ...props,
                  });
                  return (
                    <Image
                      src={img.url}
                      alt={img.alt || 'project'}
                      width={img.width}
                      height={img.height}
                      style={{width: '100%', height: 'auto'}}
                    />
                  );
                })()}
              </figure>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
