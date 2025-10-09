import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {TestimonialCard1} from '@/subapps/website/common/components/reuseable/testimonial-cards';
// -------- data -------- //
import {TemplateProps} from '@/subapps/website/common/types';

import type {Testimonial1Data} from './meta';

export function Testimonial1(props: TemplateProps<Testimonial1Data>) {
  const {data} = props;
  const {
    testimonial1Title: title,
    testimonial1Caption: caption,
    testimonial1Description: description,
    testimonial1LinkText: linkText,
    testimonial1Link: link,
    testimonial1TestimonialList: testimonialList,
    testimonial1WrapperClassName: wrapperClassName,
    testimonial1ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
            <div className="row gx-md-5 gy-5">
              {testimonialList?.map((item, i) => (
                <div className={`col-md-6 ${item.attrs.columnClasses}`} key={i}>
                  <TestimonialCard1
                    name={item.attrs.name}
                    designation={item.attrs.designation}
                    review={item.attrs.review}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="col-lg-5">
            <h2 className="fs-16 text-uppercase text-muted mb-3 mt-lg-n6">
              {title}
            </h2>
            <h3 className="display-4 mb-5">{caption}</h3>
            <p>{description}</p>
            {linkText && (
              <NextLink
                href={link || '#'}
                title={linkText}
                className="btn btn-primary rounded-pill mt-3"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
