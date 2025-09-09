import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service12Data} from './meta';
import {
  getMetaFileURL,
  getTemplateId,
} from '@/subapps/website/common/utils/helper';
import {Fragment} from 'react';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import IconProps from '../../types/icons';
import dynamic from 'next/dynamic';

function getIcon(icon: string) {
  if (!icon) return (props: IconProps) => null;
  return dynamic(() => import(`@/subapps/website/common/icons/solid/${icon}`));
}

export function Service12(props: TemplateProps<Service12Data>) {
  const {data} = props;
  const {
    service12Caption: caption,
    service12Title: title,
    service12Tabs: tabs,
  } = data || {};

  const tabId = getTemplateId(props);
  return (
    <div className="container">
      <Fragment>
        <div className="row">
          <div className="col-md-10 offset-md-1 col-lg-8 offset-lg-2 mx-auto text-center">
            <h2 className="fs-15 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-4 mb-10 px-xl-10">{title}</h3>
          </div>
        </div>

        <ul
          role="tablist"
          className="nav nav-tabs nav-tabs-bg nav-tabs-shadow-lg d-flex justify-content-between nav-justified flex-lg-row flex-column">
          {tabs?.map(({id, attrs: item}, i) => {
            const Icon = item.icon && getIcon(item.icon);
            return (
              <li className="nav-item" role="presentation" key={id}>
                <a
                  role="tab"
                  href={`#${tabId}-${i + 1}`}
                  data-bs-toggle="tab"
                  aria-selected={i === 0}
                  className={`nav-link d-flex flex-row ${i === 0 ? 'active' : ''}`}>
                  <div>
                    {Icon && <Icon className="solid icon-svg-md me-4" />}
                  </div>

                  <div>
                    <h4 className="mb-1">{item.title}</h4>
                    <p>{item.description}</p>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="tab-content mt-6 mt-lg-8 mb-md-9">
          {tabs?.map(({id, attrs: item}, i) => (
            <div
              className={`tab-pane fade ${i === 0 ? 'active show' : ''}`}
              id={`${tabId}-${i + 1}`}
              role="tabpanel"
              key={id}>
              <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
                <div className="col-lg-6">
                  <div className="row gx-md-5 gy-5 align-items-center">
                    {item.images?.map(({id, attrs: image}, j) => (
                      <div className="col-6" key={id}>
                        <img
                          alt={image.alt}
                          src={getMetaFileURL({
                            metaFile: image.image,
                            path: `service12Tabs[${i}].attrs.images[${j}].attrs.image`,
                            ...props,
                          })}
                          className="img-fluid rounded shadow-lg d-flex ms-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <List
                  title={item.listTitle}
                  description={item.listDescription}
                  list={item.list?.map(listItem => listItem.attrs.item)}
                  linkTitle={item.linkTitle}
                  linkHref={item.linkHref}
                />
              </div>
            </div>
          ))}
        </div>
      </Fragment>
    </div>
  );
}

const List = ({title, list, linkTitle, linkHref, description}: any) => {
  return (
    <div className="col-lg-6">
      <h2 className="mb-3">{title}</h2>
      <p>{description}</p>

      <ul className="icon-list bullet-bg bullet-soft-primary">
        {list?.map((item: string, i: number) => (
          <li key={i}>
            <i className="uil uil-check" /> {item}
          </li>
        ))}
      </ul>

      <NextLink
        title={linkTitle}
        href={linkHref}
        className="btn btn-primary mt-2"
      />
    </div>
  );
};
