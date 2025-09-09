import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial15Data} from './meta';
import {TestimonialCard6} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial15(props: TemplateProps<Testimonial15Data>) {
  const {data} = props;
  const {testimonial15Testimonials: testimonials} = data || {};

  return (
    <div className="container">
      <div className="grid mb-18">
        <div className="row isotope gy-6 mt-n18">
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
  );
}
