import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial12Data} from './meta';
import {TestimonialCard5} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial12(props: TemplateProps<Testimonial12Data>) {
  const {data} = props;
  const {testimonial12Testimonials: testimonials} = data || {};

  return (
    <div className="container">
      <div className="grid mb-14 mb-md-18 mt-3">
        <div className="row isotope gy-6 mt-n19 mt-md-n22">
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
  );
}
