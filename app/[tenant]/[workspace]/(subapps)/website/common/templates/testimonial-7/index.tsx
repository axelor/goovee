import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial7Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Tiles3 from '@/subapps/website/common/components/elements/tiles/Tiles3';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import TestimonialCard2 from '@/subapps/website/common/components/reuseable/testimonial-cards/TestimonialCard2';

export default function Testimonial7(props: TemplateProps<Testimonial7Data>) {
  const {data} = props;
  const {
    testimonial7TileImage1,
    testimonial7TileImage2,
    testimonial7Heading: heading,
    testimonial7CountUp: countUp,
    testimonial7Suffix: suffix,
    testimonial7SlidesPerView: slidesPerView,
    testimonial7Navigation: navigation,
    testimonial7Testimonials: testimonials = [],
    testimonial7WrapperClassName: wrapperClassName,
    testimonial7ContainerClassName: containerClassName,
  } = data || {};

  const tileImage1 = getImage({
    image: testimonial7TileImage1,
    path: 'testimonial7TileImage1',
    ...props,
  });

  const tileImage2 = getImage({
    image: testimonial7TileImage2,
    path: 'testimonial7TileImage2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-6 align-items-center">
          <div className="col-lg-7 position-relative">
            <div
              className="shape bg-dot primary rellax w-18 h-18"
              style={{top: 0, left: '-1.4rem', zIndex: 0}}
            />
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
      </div>
    </section>
  );
}
