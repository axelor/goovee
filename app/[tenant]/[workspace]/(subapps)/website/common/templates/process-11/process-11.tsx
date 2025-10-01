import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process11Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import {ProcessList2} from '@/subapps/website/common/components/reuseable/process-list';
import {Fragment} from 'react';

export function Process11(props: TemplateProps<Process11Data>) {
  const {data} = props;
  const {
    process11Title: title,
    process11Caption: caption,
    process11Heading: heading,
    process11Image,
    process11Processes: processes,
    process11WrapperClassName: wrapperClassName = '',
    process11ContainerClassName: containerClassName = '',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: process11Image,
    path: 'process11Image',
    ...props,
  });

  return (
    <section className={`wrapper ${wrapperClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <Fragment>
          <div className="row mb-8 text-center">
            <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto">
              <h2 className="fs-16 text-uppercase text-primary mb-3">
                {caption}
              </h2>
              <h3 className="display-4">{title}</h3>
            </div>
          </div>

          <div className="row gx-lg-8 gx-xl-12 gy-10 mb-14 mb-md-17 align-items-center">
            <div className="col-lg-6 position-relative">
              <div
                className="shape bg-dot leaf rellax w-17 h-18"
                style={{bottom: '-2rem', left: '-0.7rem'}}
              />

              <figure className="rounded">
                <img src={image} alt="" />
              </figure>
            </div>

            <div className="col-lg-6 col-xxl-5">
              <h3 className="display-6 mb-7">{heading}</h3>
              {processes?.map(item => (
                <ProcessList2
                  key={item.id}
                  no={item.attrs.no}
                  title={item.attrs.title}
                  subtitle={item.attrs.subtitle}
                  className="icon btn btn-circle btn-soft-primary pe-none me-5"
                />
              ))}
            </div>
          </div>
        </Fragment>
      </div>
    </section>
  );
}
