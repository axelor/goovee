import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts7Data} from './meta';
import Counter1 from '@/subapps/website/common/components/reuseable/counter/Counter1';

export default function Facts7(props: TemplateProps<Facts7Data>) {
  const {data} = props;
  const {
    facts7Title: title,
    facts7Description: description,
    facts7Facts: facts,
    facts7WrapperClassName: wrapperClassName,
    facts7ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0 mb-2 text-white align-items-center">
          <div className="col-lg-4">
            <h3 className="display-4 text-white mb-3">{title}</h3>
            <p className="lead fs-lg mb-0">{description}</p>
          </div>

          <div className="col-lg-8 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => (
                <Counter1
                  key={id}
                  title={item.title}
                  number={item.amount}
                  titleColor="text-white"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
