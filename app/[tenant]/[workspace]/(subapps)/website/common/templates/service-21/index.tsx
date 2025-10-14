import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service21Data} from './meta';
import ServiceCard1 from '@/subapps/website/common/components/reuseable/service-cards/ServiceCard1';
import dynamic from 'next/dynamic';
import IconProps from '../../types/icons';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}
export default function Service21(props: TemplateProps<Service21Data>) {
  const {data} = props;
  const {
    service21Services: services,
    service21WrapperClassName: wrapperClassName,
    service21ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-5 gy-5 mt-n19 mb-14 mb-md-17">
          {services?.map(({id, attrs: item}) => {
            return (
              <ServiceCard1
                key={id}
                linkUrl={item.link}
                title={item.title}
                Icon={getIcon(item.icon)}
                linkType={item.linkType}
                iconClassName={item.iconClassName}
                description={item.description}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
