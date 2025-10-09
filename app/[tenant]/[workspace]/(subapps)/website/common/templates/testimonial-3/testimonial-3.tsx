import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial3Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {Fragment} from 'react';
import {Tiles3} from '@/subapps/website/common/components/elements/tiles';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import TestimonialCard2 from '@/subapps/website/common/components/reuseable/testimonial-cards/TestimonialCard2';

export function Testimonial3(props: TemplateProps<Testimonial3Data>) {
  const {data} = props;
  const {
    testimonial3Title: title,
    testimonial3Description: description,
    testimonial3TileImage1,
    testimonial3TileImage2,
    testimonial3Heading: heading,
    testimonial3CountUp: countUp,
    testimonial3Suffix: suffix,
    testimonial3SlidesPerView: slidesPerView,
    testimonial3Navigation: navigation,
    testimonial3Testimonials: testimonials = [],
    testimonial3WrapperClassName: wrapperClassName,
    testimonial3ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: testimonial3TileImage1,
    path: 'testimonial3TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: testimonial3TileImage2,
    path: 'testimonial3TileImage2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <h3 className="display-4 mb-3 text-center">{title}</h3>
          <p className="lead fs-lg mb-10 text-center">{description}</p>

          <div className="row gx-lg-8 gx-xl-12 gy-6 mb-14 align-items-center">
            <div className="col-lg-7">
              <Tiles3
                image1={tileImage1}
                image2={tileImage2}
                heading={heading}
                countUp={countUp}
                suffix={suffix}
              />
            </div>

            <div className="col-lg-5 mt-5">
              <div className="swiper-container dots-closer mb-6">
                <Carousel
                  grabCursor
                  slidesPerView={slidesPerView}
                  navigation={navigation}>
                  {testimonials?.map(({id, attrs: item}) => (
                    <TestimonialCard2
                      key={id}
                      name={item.name}
                      review={item.review}
                      designation={item.designation}
                    />
                  ))}
                </Carousel>
              </div>
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
