import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service15Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import Image from 'next/image';

export function Service15(props: TemplateProps<Service15Data>) {
  const {data} = props;
  const {
    service15Title: title,
    service15Caption: caption,
    service15Description: description,
    service15Image,
    service15Services: services,
    service15WrapperClassName: wrapperClassName,
    service15ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: service15Image,
    path: 'service15Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7 order-lg-2">
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
            <h2 className="fs-15 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-5">{title}</h3>
            <p className="mb-6">{description}</p>

            <ListColumn
              list={services?.attrs.list}
              rowClass={services?.attrs.rowClass}
              bulletColor={services?.attrs.bulletColor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
