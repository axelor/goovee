import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts1Data} from './meta';
import Counter1 from '@/subapps/website/common/components/reuseable/counter/Counter1';

export default function Facts1(props: TemplateProps<Facts1Data>) {
  const {data} = props;
  const {
    facts1Title: title,
    facts1Caption: caption,
    facts1Facts: facts,
    facts1WrapperClassName: wrapperClassName,
    facts1ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-2 align-items-end">
          <div className="col-lg-4">
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-0">{title}</h3>
          </div>

          <div className="col-lg-8 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => (
                <Counter1 key={id} title={item.title} number={item.number} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
