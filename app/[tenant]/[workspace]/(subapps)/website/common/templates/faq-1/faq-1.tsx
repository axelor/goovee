import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq1Data} from './meta';
import Accordion from '@/subapps/website/common/components/reuseable/accordion';
import {Fragment} from 'react';

export function FAQ1(props: TemplateProps<Faq1Data>) {
  const {data} = props;
  const {
    faq1Title: title,
    faq1Caption: caption,
    faq1Questions: questions,
  } = data || {};

  const half = Math.ceil((questions?.length ?? 0) / 2);
  const questions1 = questions?.slice(0, half);
  const questions2 = questions?.slice(half);

  return (
    <div className="container">
      <Fragment>
        <h2 className="fs-15 text-uppercase text-muted mb-3 text-center">
          {caption}
        </h2>
        <h3 className="display-4 mb-10 px-lg-12 text-center">{title}</h3>

        <div className="accordion-wrapper" id={`faq-1-${props.contentId}`}>
          <div className="row">
            <div className="col-md-6">
              {questions1?.map(({id, attrs: item}) => (
                <Accordion
                  key={id}
                  no={id}
                  expand={item.expand}
                  heading={item.heading}
                  body={item.body}
                  parentId={`faq-1-${props.contentId}`}
                />
              ))}
            </div>
            <div className="col-md-6">
              {questions2?.map(({id, attrs: item}) => (
                <Accordion
                  key={id}
                  no={id}
                  expand={item.expand}
                  heading={item.heading}
                  body={item.body}
                  parentId={`faq-1-${props.contentId}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Fragment>
    </div>
  );
}
