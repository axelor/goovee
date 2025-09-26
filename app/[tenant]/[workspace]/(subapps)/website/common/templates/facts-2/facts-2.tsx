import type {TemplateProps} from '@/subapps/website/common/types';
import {type Facts2Data} from './meta';
import {Counter3} from '@/subapps/website/common/components/reuseable/counter';
import dynamic from 'next/dynamic';

function getIcon(icon: string) {
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}
export function Facts2(props: TemplateProps<Facts2Data>) {
  const {data} = props;
  const {
    facts2Title: title,
    facts2Subtitle: subtitle,
    facts2Facts: facts,
    facts2WrapperClassName: wrapperClassName,
    facts2ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 gy-lg-0">
          <div className="col-lg-4">
            <h3 className="display-4 mb-3 pe-xl-10">{title}</h3>
            <p className="lead fs-lg mb-0 pe-xxl-6">{subtitle}</p>
          </div>

          <div className="col-lg-8 mt-lg-2">
            <div className="row align-items-center counter-wrapper gy-6 text-center">
              {facts?.map(({id, attrs: item}) => {
                const Icon = item.icon && getIcon(item.icon);
                return (
                  <Counter3
                    key={id}
                    title={item.title || ''}
                    number={item.number || 0}
                    suffix={item.suffix}
                    Icon={Icon ? <Icon /> : null}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
