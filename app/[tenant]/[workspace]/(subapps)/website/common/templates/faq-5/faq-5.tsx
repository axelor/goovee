import type {TemplateProps} from '@/subapps/website/common/types';
import {type Faq5Data} from './meta';

export function FAQ5(props: TemplateProps<Faq5Data>) {
  const {data} = props;
  const {faq5Questions: questions} = data || {};

  return (
    <div className="container">
      <div className="row gx-md-8 gx-xl-12 gy-10">
        {questions?.map(({id, attrs: item}) => (
          <div className="col-lg-6" key={id}>
            <div className="d-flex flex-row">
              <div>
                <span className="icon btn btn-sm btn-circle btn-primary pe-none me-5">
                  <i className="uil uil-comment-exclamation" />
                </span>
              </div>
              <div>
                <h4>{item.title}</h4>
                <p className="mb-0">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
