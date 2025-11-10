import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq2Data} from './meta';
import Accordion from '@/subapps/website/common/components/reuseable/accordion';

export default function FAQ2(props: TemplateProps<Faq2Data>) {
  const {data} = props;
  const {
    faq2Title: title,
    faq2Caption: caption,
    faq2Questions: questions,
    faq2WrapperClassName: wrapperClassName,
    faq2ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-11 col-xxl-10 mx-auto text-center">
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-5 mb-10 px-lg-12 px-xl-10 px-xxl-17">
              {title}
            </h3>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="accordion-wrapper" id={`faq-2-${props.contentId}`}>
              {questions?.map(({id, attrs: item}) => (
                <Accordion
                  key={id}
                  no={id}
                  expand={item.expand}
                  heading={item.heading}
                  body={item.body}
                  parentId={`faq-2-${props.contentId}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
