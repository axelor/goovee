import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import {ProcessList2} from '@/subapps/website/common/components/reuseable/process-list';
import Image from 'next/image';

export function Process2(props: TemplateProps<Process2Data>) {
  const {data} = props;
  const {
    process2Title: title,
    process2Caption: caption,
    process2Image,
    process2Processes: processes,
    process2WrapperClassName: wrapperClassName,
    process2ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: process2Image,
    path: 'process2Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center mb-14 mb-md-17 mb-lg-19">
          <div className="col-md-8 col-lg-6 position-relative">
            <div
              className="shape bg-line red rounded-circle rellax w-18 h-18"
              style={{top: '-2.2rem', left: '-2.4rem'}}
            />

            <div
              className="shape rounded bg-soft-primary rellax d-md-block"
              style={{
                width: '85%',
                height: '90%',
                right: '-1.5rem',
                bottom: '-1.8rem',
              }}
            />

            <figure className="rounded">
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5 col-xl-4 offset-lg-1">
            <h2 className="display-4 mb-3">{title}</h2>
            <p className="lead fs-lg mb-6">{caption}</p>

            {processes?.map(item => (
              <ProcessList2
                key={item.id}
                no={item.attrs.no}
                title={item.attrs.title}
                subtitle={item.attrs.subtitle}
                className="icon btn btn-circle btn-primary pe-none me-5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
