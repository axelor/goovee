import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process7Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {ProcessList1} from '@/subapps/website/common/components/reuseable/process-list';
import {Fragment} from 'react';

export function Process7(props: TemplateProps<Process7Data>) {
  const {data} = props;
  const {
    process7Title: title,
    process7Heading: heading,
    process7Caption: caption,
    process7Para1: para1,
    process7Para2: para2,
    process7LinkTitle: linkTitle,
    process7LinkHref: linkHref,
    process7Processes: processes,
    process7WrapperClassName: wrapperClassName,
    process7ContainerClassName: containerClassName,
  } = data || {};

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <Fragment>
          <div className="row mb-5">
            <div className="col-md-10 col-xl-8 col-xxl-7 mx-auto text-center">
              <h2 className="display-4 mb-4">{title}</h2>
            </div>
          </div>

          <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
            <div className="col-lg-6 order-lg-2">
              {processes?.map(item => (
                <ProcessList1
                  shadow
                  key={item.id}
                  no={item.attrs.no}
                  title={item.attrs.title}
                  subtitle={item.attrs.subtitle}
                  className={item.attrs.className}
                />
              ))}
            </div>

            <div className="col-lg-6">
              <h2 className="display-6 mb-3">{heading}</h2>
              <p className="lead fs-lg pe-lg-5">{caption}</p>

              <p>{para1}</p>

              <p className="mb-6">{para2}</p>

              <NextLink
                href={linkHref}
                title={linkTitle}
                className="btn btn-primary rounded-pill mb-0"
              />
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
