import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service9Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {ServiceCard4} from '@/subapps/website/common/components/reuseable/service-cards';
import dynamic from 'next/dynamic';
import IconProps from '../../types/icons';

function getIcon(icon?: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Service9(props: TemplateProps<Service9Data>) {
  const {data} = props;
  const {
    service9Title: title,
    service9Description: description,
    service9Caption: caption,
    service9LinkTitle: linkTitle,
    service9LinkHref: linkHref,
    service9ServiceList: serviceList,
  } = data || {};

  return (
    <div className="container">
      <div className="row gx-lg-8 gx-xl-12 gy-10 mb-lg-22 mb-xl-24 align-items-center">
        <div className="col-lg-7 order-lg-2">
          <div className="row gx-md-5 gy-5">
            {serviceList?.map(({id, attrs: item}) => {
              const Icon = getIcon(item.icon);
              return (
                <ServiceCard4
                  key={id}
                  title={item.title}
                  description={item.description}
                  columnClass={item.columnClass}
                  cardColor={`bg-${item.cardColor}`}
                  Icon={
                    <Icon
                      className={`solid icon-svg-md text-${item.iconColor} mb-3`}
                    />
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="col-lg-5">
          <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
          <h3 className="display-4 mb-5">{title}</h3>
          <p>{description}</p>
          <NextLink
            href={linkHref}
            title={linkTitle}
            className="btn btn-navy rounded-pill mt-3"
          />
        </div>
      </div>
    </div>
  );
}
