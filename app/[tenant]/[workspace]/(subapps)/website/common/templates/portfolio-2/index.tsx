import type {TemplateProps} from '@/subapps/website/common/types';
import {type Portfolio2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function Portfolio2(props: TemplateProps<Portfolio2Data>) {
  const {data} = props;
  const {
    portfolio2Caption: caption,
    portfolio2SlidesPerView: slidesPerView,
    portfolio2Pagination: pagination,
    portfolio2CarouselImages: carouselImages = [],
    portfolio2WrapperClassName: wrapperClassName,
    portfolio2ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto text-center">
            <h3 className="display-4 mb-8">{caption}</h3>
          </div>
        </div>

        <div className="swiper-container grid-view nav-bottom nav-color mb-14">
          <Carousel
            grabCursor
            slidesPerView={slidesPerView}
            pagination={pagination}
            className="overflow-visible"
            breakpoints={{768: {slidesPerView: 2}, 0: {slidesPerView: 1}}}>
            {carouselImages?.map(({id, attrs: item}, i) => (
              <figure className="rounded" key={id}>
                {(() => {
                  const img = getImage({
                    image: item.image,
                    path: `portfolio2CarouselImages[${i}].attrs.image`,
                    ...props,
                  });
                  return (
                    <Image
                      width={img.width}
                      height={img.height}
                      src={img.url}
                      alt={img.alt || ''}
                      style={{width: '100%', height: 'auto'}}
                    />
                  );
                })()}
                <NextLink
                  title={<i className="uil uil-link" />}
                  className="item-link"
                  href={item.url}
                />
              </figure>
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
