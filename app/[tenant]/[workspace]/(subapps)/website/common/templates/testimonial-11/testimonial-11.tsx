import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Testimonial11Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export function Testimonial11(props: TemplateProps<Testimonial11Data>) {
  const {data} = props;
  const {
    testimonial11Image,
    testimonial11SlidesPerView: slidesPerView,
    testimonial11Navigation: navigation,
    testimonial11Testimonials: testimonials = [],
    testimonial11WrapperClassName: wrapperClassName,
    testimonial11ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: testimonial11Image,
    path: 'testimonial11Image',
    ...props,
  });

  const ratingMap: {[key: number]: string} = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
  };

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-white text-center">
          <div className="col-xl-10 mx-auto">
            <div className="card image-wrapper bg-full overflow-hidden position-relative">
              <Image
                src={image.url}
                alt={image.alt || 'Testimonial background'}
                fill
                className="object-fit-cover"
              />
              <div
                className="position-absolute top-0 left-0 w-100 h-100 bg-dark opacity-40"
                style={{zIndex: 1}}></div>
              <div
                className="card-body p-9 p-xl-12 position-relative"
                style={{zIndex: 2}}>
                <div className="row gx-0">
                  <div className="col-xxl-9 mx-auto">
                    <div className="swiper-container dots-light dots-closer mb-6">
                      <Carousel
                        grabCursor
                        navigation={navigation || false}
                        slidesPerView={slidesPerView || 1}>
                        {testimonials?.map(({id, attrs: item}) => (
                          <div key={id}>
                            {item.rating && ratingMap[item.rating] && (
                              <span
                                className={`ratings ${ratingMap[item.rating]} mb-3`}
                              />
                            )}
                            <blockquote className="border-0 fs-lg mb-2">
                              <p>“{item.review}”</p>
                              <div className="blockquote-details justify-content-center text-center">
                                <div className="info ps-0">
                                  <h5 className="mb-1 text-white">
                                    {item.name}
                                  </h5>
                                  <p className="mb-0">{item.designation}</p>
                                </div>
                              </div>
                            </blockquote>
                          </div>
                        ))}
                      </Carousel>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
