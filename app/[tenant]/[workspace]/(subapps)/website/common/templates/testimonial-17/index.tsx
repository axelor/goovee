import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial17Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import TestimonialCard3 from '@/subapps/website/common/components/reuseable/testimonial-cards/TestimonialCard3';

export default function Testimonial17(props: TemplateProps<Testimonial17Data>) {
  const {data} = props;
  const {
    testimonial17Caption: caption,
    testimonial17Description: description,
    testimonial17Testimonials: testimonials,
    testimonial17WrapperClassName: wrapperClassName,
    testimonial17ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-lg-8 offset-lg-2">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-3 mb-10 px-xxl-10">{description}</h3>
          </div>
        </div>

        <div className="grid">
          <div className="row isotope gy-6">
            {testimonials?.map(({id, attrs: item}, i) => (
              <div className="item col-md-6 col-xl-4" key={id}>
                <TestimonialCard3
                  shadow
                  name={item.name}
                  review={item.review}
                  designation={item.designation}
                  rating={item.rating}
                  image={getImage({
                    image: item.image,
                    path: `testimonial17Testimonials[${i}].attrs.image`,
                    ...props,
                  })}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
