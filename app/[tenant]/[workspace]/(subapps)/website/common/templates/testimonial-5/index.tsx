import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial5Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import TestimonialCard2 from '@/subapps/website/common/components/reuseable/testimonial-cards/TestimonialCard2';
import Image from 'next/image';

export default function Testimonial5(props: TemplateProps<Testimonial5Data>) {
  const {data} = props;
  const {
    testimonial5Image,
    testimonial5SlidesPerView: slidesPerView,
    testimonial5Navigation: navigation,
    testimonial5Testimonials: testimonials = [],
    testimonial5WrapperClassName: wrapperClassName,
    testimonial5ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: testimonial5Image,
    path: 'testimonial5Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-0 align-items-center">
          <div className="col-md-5 col-lg-5 col-xl-4 offset-xl-1 d-none d-md-flex position-relative align-self-end">
            <div
              className="shape rounded-circle bg-pale-primary rellax w-21 h-21 d-md-none d-lg-block"
              style={{top: '7rem', left: '1rem'}}
            />

            <figure>
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-md-7 col-lg-6 col-xl-6 col-xxl-5 offset-xl-1">
            <div className="swiper-container dots-start dots-closer mt-md-10 mb-md-15">
              <Carousel
                grabCursor
                slidesPerView={slidesPerView}
                navigation={navigation}>
                {testimonials?.map(({id, attrs: item}, i) => (
                  <TestimonialCard2
                    key={id}
                    name={item.name}
                    review={item.review}
                    designation={item.designation}
                    blockClassName="icon fs-lg"
                    blockDetailsClassName="blockquote-details"
                  />
                ))}
              </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
