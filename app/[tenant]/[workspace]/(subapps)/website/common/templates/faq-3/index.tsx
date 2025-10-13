import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq3Data} from './meta';
import Accordion from '@/subapps/website/common/components/reuseable/accordion';

export default function FAQ3(props: TemplateProps<Faq3Data>) {
  const {data} = props;
  const {
    faq3Title: title,
    faq3Caption: caption,
    faq3Questions: questions,
    faq3WrapperClassName: wrapperClassName,
    faq3ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="card bg-soft-primary rounded-4">
          <div className="card-body p-md-10 p-xl-11">
            <div className="row gx-lg-8 gx-xl-12 gy-10">
              <div className="col-lg-6">
                <h3 className="display-4 mb-4">{title}</h3>
                <p className="lead fs-lg mb-0">{caption}</p>
              </div>

              <div className="col-lg-6">
                <div
                  className="accordion accordion-wrapper"
                  id={`faq-3-${props.contentId}`}>
                  {questions?.map(({id, attrs: item}) => (
                    <Accordion
                      type="plain"
                      key={id}
                      no={id}
                      expand={item.expand}
                      heading={item.heading}
                      body={item.body}
                      parentId={`faq-3-${props.contentId}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
