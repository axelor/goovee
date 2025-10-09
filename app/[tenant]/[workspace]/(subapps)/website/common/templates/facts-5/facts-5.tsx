import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts5Data} from './meta';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import Design from '@/subapps/website/common/icons/lineal/Design';
import dynamic from 'next/dynamic';

function getIcon(icon?: string) {
  if (!icon) return Design;
  return dynamic(() => import(`@/subapps/website/common/icons/lineal/${icon}`));
}

export function Facts5(props: TemplateProps<Facts5Data>) {
  const {data} = props;
  const {
    facts5Facts: facts,
    facts5WrapperClassName: wrapperClassName,
    facts5ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row mb-10">
          <div className="col-xl-10 mx-auto">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => {
                const Icon = getIcon(item.icon);
                return (
                  <div className="col-md-3" key={id}>
                    <Icon className="icon-svg-lg text-primary mb-3" />
                    <h3 className="counter">
                      <CountUp end={item.value || 0} separator="" />
                    </h3>
                    <p>{item.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
