import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial10Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {TestimonialCard3} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial10(props: TemplateProps<Testimonial10Data>) {
  const {data} = props;
  const {
    testimonial10Caption: caption,
    testimonial10Description: description,
    testimonial10Testimonials: testimonials,
    testimonial10WrapperClassName: wrapperClassName,
    testimonial10ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row mt-md-n25">
          <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2 mx-auto text-center">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-10 px-xl-10 px-xxl-15">
              {description}
            </h3>
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
                  image={getImage({
                    image: item.image,
                    path: `testimonial10Testimonials[${i}].attrs.image`,
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
