import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts10Data} from './meta';
import {Counter1} from '@/subapps/website/common/components/reuseable/counter';

export function Facts10(props: TemplateProps<Facts10Data>) {
  const {data} = props;
  const {
    facts10Title: title,
    facts10Caption: caption,
    facts10Facts: facts,
    facts10WrapperClassName: wrapperClassName,
    facts10ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 align-items-center">
          <div className="col-lg-4 text-center text-lg-start">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-3">{title}</h3>
          </div>

          <div className="col-lg-8 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => (
                <Counter1 key={id} title={item.title} number={item.amount} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
