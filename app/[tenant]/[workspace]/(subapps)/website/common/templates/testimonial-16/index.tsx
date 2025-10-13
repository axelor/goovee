import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Testimonial16Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';

export default function Testimonial16(props: TemplateProps<Testimonial16Data>) {
  const {data} = props;
  const {
    testimonial16BackgroundImage,
    testimonial16SlidesPerView: slidesPerView,
    testimonial16Navigation: navigation,
    testimonial16Testimonials: testimonials = [],
    testimonial16WrapperClassName: wrapperClassName,
    testimonial16ContainerClassName: containerClassName,
  } = data || {};

  const backgroundImage = getImage({
    image: testimonial16BackgroundImage,
    path: 'testimonial16BackgroundImage',
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
        <div className="card shadow-lg">
          <div className="row gx-0">
            <div className="col-lg-6 image-wrapper rounded-top rounded-lg-start overflow-hidden">
              <Image
                src={backgroundImage.url}
                alt={backgroundImage.alt || 'testimonial background'}
                fill
                className="object-cover"
              />
            </div>

            <div className="col-lg-6">
              <div className="p-10 p-md-11 px-lg-13 py-lg-14">
                <div className="swiper-container dots-closer mb-6">
                  <Carousel
                    grabCursor
                    slidesPerView={slidesPerView || 1}
                    navigation={navigation || false}>
                    {testimonials?.map(({id, attrs: item}) => (
                      <div className="text-center" key={id}>
                        {item.rating && ratingMap[item.rating] && (
                          <span
                            className={`ratings ${ratingMap[item.rating]} mt-4 mb-3`}
                          />
                        )}
                        <blockquote className="border-0 fs-lg text-center">
                          <p>“{item.review}”</p>
                          <div className="blockquote-details justify-content-center text-center">
                            <div className="info ps-0">
                              <h5 className="mb-1">{item.name}</h5>
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
    </section>
  );
}
