import type {TemplateProps} from '@/subapps/website/common/types';
import {type Process15Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';

export function Process15(props: TemplateProps<Process15Data>) {
  const {data} = props;
  const {
    process15Title: title,
    process15Caption: caption,
    process15Image,
    process15Processes: processes,
    process15WrapperClassName: wrapperClassName,
    process15ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: process15Image,
    path: 'process15Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-15 mb-md-17 align-items-center">
          <div className="col-lg-7">
            <figure>
              <Image
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>{' '}
          </div>

          <div className="col-lg-5">
            <h3 className="fs-16 text-uppercase text-muted mb-3">{caption}</h3>
            <h3 className="display-5 mb-6">{title}</h3>

            <div className="row gy-4">
              {processes?.map(({id, attrs: item}, i) => (
                <div className="col-md-6" key={id}>
                  <h4>
                    <span className="text-primary">{i + 1}.</span> {item.title}
                  </h4>
                  <p className="mb-0 fs-16">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
