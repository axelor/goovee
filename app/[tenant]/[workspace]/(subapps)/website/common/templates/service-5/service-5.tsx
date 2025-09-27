import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service5Data} from './meta';
import {CountUp} from '@/subapps/website/common/components/reuseable/countup';
import {Fragment} from 'react';
import {Tiles1} from '@/subapps/website/common/components/elements/tiles';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import {ServiceCard3} from '@/subapps/website/common/components/reuseable/service-cards';
import dynamic from 'next/dynamic';

const getIcon = (icon: string) => {
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
};

export function Service5(props: TemplateProps<Service5Data>) {
  const {data} = props;
  const {
    service5Title: title,
    service5Description: description,
    service5Experience: experience,
    service5ExperienceSuffix: experienceSuffix,
    service5ExperienceDescription: experienceDescription,
    service5Services: services,
    service5Features: features,
  } = data || {};

  return (
    <div className="container">
      <Fragment>
        <div className="row gx-lg-8 gx-xl-12 gy-12 align-items-center mb-10 mb-md-13">
          <div className="col-lg-6 position-relative">
            <div
              className="btn btn-circle btn-primary pe-none position-absolute counter-wrapper flex-column d-none d-md-flex"
              style={{
                zIndex: 1,
                top: '50%',
                width: 170,
                height: 170,
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}>
              <h3 className="text-white mb-1 mt-n2">
                <span className="counter counter-lg">
                  <CountUp end={experience || 0} suffix={experienceSuffix} />
                </span>
              </h3>

              <p>{experienceDescription}</p>
            </div>

            <Tiles1 />
          </div>

          <div className="col-lg-6">
            <h3 className="display-4 mb-5">{title}</h3>

            <p className="mb-7">{description}</p>

            <ListColumn
              list={features?.attrs.list ?? []}
              rowClass={features?.attrs.rowClass}
              bulletColor={features?.attrs.bulletColor}
            />
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-8">
          {services?.map(({id, attrs: item}) => {
            const Icon = item.icon && getIcon(item.icon);
            return (
              <div className="col-md-6 col-lg-4" key={id}>
                <ServiceCard3
                  title={item.title}
                  description={item.description}
                  Icon={
                    Icon && (
                      <Icon className="solid text-violet icon-svg-sm me-4" />
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      </Fragment>
    </div>
  );
}
