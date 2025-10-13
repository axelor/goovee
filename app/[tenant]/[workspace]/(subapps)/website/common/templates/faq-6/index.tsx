import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq6Data} from './meta';
import Accordion from '@/subapps/website/common/components/reuseable/accordion';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function FAQ6(props: TemplateProps<Faq6Data>) {
  const {data} = props;
  const {
    faq6Title: title,
    faq6Caption: caption,
    faq6Description: description,
    faq6LinkTitle: linkTitle,
    faq6LinkHref: linkHref,
    faq6Questions: questions,
    faq6WrapperClassName: wrapperClassName,
    faq6ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10">
          <div className="col-lg-6 mb-0">
            <h2 className="fs-16 text-uppercase text-primary mb-4">
              {caption}
            </h2>
            <h3 className="display-3 mb-4">{title}</h3>
            <p className="mb-6">{description}</p>
            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-primary rounded-pill"
            />
          </div>

          <div className="col-lg-6">
            <div className="accordion-wrapper" id={`faq-6-${props.contentId}`}>
              {questions?.map(({id, attrs: item}) => (
                <Accordion
                  type="shadow-lg"
                  key={id}
                  no={id}
                  expand={item.expand}
                  heading={item.heading}
                  body={item.body}
                  parentId={`faq-6-${props.contentId}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="divider text-navy mx-n2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path
              fill="currentColor"
              d="M1260,1.65c-60-5.07-119.82,2.47-179.83,10.13s-120,11.48-180,9.57-120-7.66-180-6.42c-60,1.63-120,11.21-180,16a1129.52,1129.52,0,0,1-180,0c-60-4.78-120-14.36-180-19.14S60,7,30,7H0v93H1440V30.89C1380.07,23.2,1319.93,6.15,1260,1.65Z"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
