import {FC} from 'react';
import {TestimonialCard3} from '@/subapps/website/common/components/reuseable/testimonial-cards';
// -------- custom hook -------- //
import useIsotope from '@/subapps/website/common/hooks/useIsotope';
// -------- data -------- //
import {testimonialList} from '@/subapps/website/common/data/demo-7';

const Testimonial8: FC = () => {
  // used for masonry layout
  useIsotope();

  return (
    <div>
      <h2 className="display-4 text-center mb-8">
        What Our Customers Say About Us
      </h2>

      <div className="grid">
        <div className="row isotope gy-6">
          {testimonialList.map(item => (
            <div className="item col-md-6 col-xl-4" key={item.id}>
              <TestimonialCard3 {...item} shadow />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonial8;
