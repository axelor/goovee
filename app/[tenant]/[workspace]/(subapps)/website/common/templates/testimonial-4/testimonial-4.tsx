import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import Carousel from '@/subapps/website/common/components/reuseable/Carousel';
import carouselBreakpoints from '@/subapps/website/common/utils/carouselBreakpoints';
import {TestimonialCard3} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial4(props: TemplateProps<Testimonial4Data>) {
  const {data} = props;
  const {
    testimonial4Caption: caption,
    testimonial4Title: title,
    testimonial4SpaceBetween: spaceBetween,
    testimonial4Navigation: navigation,
    testimonial4Testimonials: testimonials = [],
  } = data || {};

  return (
    <div className="wrapper bg-light">
      <div className="container py-14 py-md-16">
        <div className="row">
          <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2 mx-auto text-center">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-6 px-xl-6">{title}</h3>
          </div>
        </div>

        <div className="swiper-container dots-closer mb-6">
          <Carousel
            spaceBetween={spaceBetween}
            grabCursor
            navigation={navigation}
            breakpoints={carouselBreakpoints}>
            {testimonials?.map(({id, attrs: item}, i) => (
              <div className="item-inner" key={id}>
                <TestimonialCard3
                  name={item.name}
                  review={item.review}
                  designation={item.designation}
                  rating={item.rating}
                  image={getMetaFileURL({
                    metaFile: item.image,
                    path: `testimonial4Testimonials[${i}].attrs.image`,
                    ...props,
                  })}
                />
              </div>
            ))}
          </Carousel>
        </div>
      </div>
    </div>
  );
}
