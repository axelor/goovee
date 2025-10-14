import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process10Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import ProcessList2 from '@/subapps/website/common/components/reuseable/process-list/ProcessList2';
import Image from 'next/image';

export default function Process10(props: TemplateProps<Process10Data>) {
  const {data} = props;
  const {
    process10Title: title,
    process10Image,
    process10Processes: processes,
    process10WrapperClassName: wrapperClassName,
    process10ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: process10Image,
    path: 'process10Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
            <figure>
              <Image
                className="w-auto"
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mb-7">{title}</h3>
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
      </div>
    </section>
  );
}
