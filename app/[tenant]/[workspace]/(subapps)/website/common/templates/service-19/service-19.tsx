import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service19Data} from './meta';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {Fragment} from 'react';

export function Service19(props: TemplateProps<Service19Data>) {
  const {data} = props;
  const {
    service19Caption: caption,
    service19Description: description,
    service19Services: services,
  } = data || {};

  return (
    <div className="container">
      <Fragment>
        <div className="row text-center">
          <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-9">{description}</h3>
          </div>
        </div>

        <div className="row gx-md-8 gx-xl-12 gy-8 mb-14 mb-md-16 text-center">
          {services?.map(({id, attrs: item}) => (
            <div className="col-md-4" key={id}>
              <IconBox
                icon={`uil-${item.icon}`}
                className={`icon btn btn-block btn-lg btn-${item.iconColor} pe-none mb-5`}
              />
              <h4>{item.title}</h4>
              <p className="mb-3">{item.description}</p>
              <NextLink
                title={item.linkTitle}
                href={item.linkUrl}
                className={`more hover link-${item.linkColor}`}
              />
            </div>
          ))}
        </div>
      </Fragment>
    </div>
  );
}
