import type {TemplateProps} from '@/subapps/website/common/types';
import {type Testimonial8Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {TestimonialCard3} from '@/subapps/website/common/components/reuseable/testimonial-cards';

export function Testimonial8(props: TemplateProps<Testimonial8Data>) {
  const {data} = props;
  const {
    testimonial8Caption: caption,
    testimonial8Testimonials: testimonials,
    testimonial8WrapperClassName: wrapperClassName,
    testimonial8ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <h2 className="display-4 text-center mb-8">{caption}</h2>

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
                  image={getMetaFileURL({
                    metaFile: item.image,
                    path: `testimonial8Testimonials[${i}].attrs.image`,
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
