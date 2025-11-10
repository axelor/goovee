import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial12Data} from './meta';
import TestimonialCard5 from '@/subapps/website/common/components/reuseable/testimonial-cards/TestimonialCard5';

export default function Testimonial12(props: TemplateProps<Testimonial12Data>) {
  const {data} = props;
  const {
    testimonial12Testimonials: testimonials,
    testimonial12WrapperClassName: wrapperClassName,
    testimonial12ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="grid">
          <div className="row isotope gy-6">
            {testimonials?.map(({id, attrs: item}) => (
              <div className="item col-md-6 col-xl-3" key={id}>
                <TestimonialCard5
                  borderBottom
                  name={item.name}
                  review={item.review}
                  designation={item.designation}
                  rating={item.rating}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
