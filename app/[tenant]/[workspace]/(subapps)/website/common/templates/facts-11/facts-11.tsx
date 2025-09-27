import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts11Data} from './meta';
import {Counter1} from '@/subapps/website/common/components/reuseable/counter';

export function Facts11(props: TemplateProps<Facts11Data>) {
  const {data} = props;
  const {
    facts11Title: title,
    facts11Caption: caption,
    facts11Facts: facts,
  } = data || {};

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-11 align-items-end">
        <div className="col-lg-4">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4 mb-0">{title}</h3>
        </div>

        <div className="col-lg-8 mt-lg-2">
          <div className="row align-items-center counter-wrapper gy-6 text-center">
            {facts?.map(({id, attrs: item}) => (
              <Counter1 key={id} number={item.amount} title={item.title} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
