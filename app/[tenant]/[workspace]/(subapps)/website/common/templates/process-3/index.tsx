import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process3Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import ProcessList2 from '@/subapps/website/common/components/reuseable/process-list/ProcessList2';
import Image from 'next/image';

export default function Process3(props: TemplateProps<Process3Data>) {
  const {data} = props;
  const {
    process3Title: title,
    process3Caption: caption,
    process3Description: description,
    process3Image,
    process3Processes: processes,
    process3WrapperClassName: wrapperClassName,
    process3ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: process3Image,
    path: 'process3Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center">
          <div className="col-md-8 col-lg-6 position-relative">
            <div
              className="shape bg-dot primary rellax w-17 h-21"
              style={{top: '-2rem', left: '-1.9rem'}}
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
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4">{title}</h3>
            <p className="mb-7">{description}</p>

            {processes?.map(item => (
              <ProcessList2
                key={item.id}
                no={item.attrs.no}
                title={item.attrs.title}
                subtitle={item.attrs.subtitle}
                className="icon btn btn-block btn-soft-primary pe-none me-5"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
