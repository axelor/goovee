import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service16Data} from './meta';
import {ServiceCard1} from '@/subapps/website/common/components/reuseable/service-cards';
import IconProps from '../../types/icons';
import dynamic from 'next/dynamic';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Service16(props: TemplateProps<Service16Data>) {
  const {data} = props;
  const {
    service16Services: services,
    service16WrapperClassName: wrapperClassName,
    service16ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-5 gy-5">
          {services?.map(({id, attrs: item}) => {
            return (
              <ServiceCard1
                key={id}
                linkUrl={item.link}
                title={item.title}
                Icon={getIcon(item.icon)}
                linkType={item.linkType}
                iconClassName={item.iconClassName}
                cardClassName={item.cardClassName}
                description={item.description}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
