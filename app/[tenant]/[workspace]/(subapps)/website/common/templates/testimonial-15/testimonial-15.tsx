import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial15Data} from './meta';
import {TestimonialCard6} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial15(props: TemplateProps<Testimonial15Data>) {
  const {data} = props;
  const {
    testimonial15Testimonials: testimonials,
    testimonial15WrapperClassName: wrapperClassName,
    testimonial15ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="grid">
          <div className="row isotope gy-6">
            {testimonials?.map(({id, attrs: item}) => (
              <div className="item col-md-6 col-xl-3" key={id}>
                <TestimonialCard6
                  name={item.name}
                  review={item.review}
                  designation={item.designation}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
