import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial14Data} from './meta';
import {TestimonialCard5} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial14(props: TemplateProps<Testimonial14Data>) {
  const {data} = props;
  const {testimonial14Testimonials: testimonials} = data || {};

  return (
    <div className="grid mb-14 mb-md-17">
      <div className="row isotope gy-6 mt-n19 mt-md-n22">
        {testimonials?.map(({id, attrs: item}) => (
          <div className="item col-md-6 col-xl-3" key={id}>
            <TestimonialCard5
              name={item.name}
              review={item.review}
              designation={item.designation}
              rating={item.rating}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
