import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service17Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import ListColumn from '@/subapps/website/common/components/reuseable/ListColumn';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Service17(props: TemplateProps<Service17Data>) {
  const {data} = props;
  const {
    service17Caption: caption,
    service17Title: title,
    service17Section1Caption,
    service17Section1Description,
    service17Section1LinkTitle,
    service17Section1LinkHref,
    service17Section2Caption,
    service17Section2Description,
    service17Section2LinkTitle,
    service17Section2LinkHref,
    service17Image1,
    service17Image2,
    service17Service1: list1,
    service17Service2: list2,
    service17WrapperClassName: wrapperClassName,
    service17ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getImage({
    image: service17Image1,
    path: 'service17Image1',
    ...props,
  });

  const image2 = getImage({
    image: service17Image2,
    path: 'service17Image2',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row mb-8 text-center">
          <div className="col-lg-8 col-xl-7 mx-auto">
            <h2 className="fs-16 text-uppercase text-primary mb-3">
              {caption}
            </h2>
            <h3 className="display-4">{title}</h3>
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-14 mb-md-17 align-items-center">
          <div className="col-lg-6 position-relative">
            <div
              className="shape bg-dot primary rellax w-17 h-18"
              style={{bottom: '-2rem', left: '-0.7rem'}}
            />

            <figure className="rounded mb-0">
              <Image
                src={image1.url}
                alt={image1.alt}
                width={image1.width}
                height={image1.height}
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h3 className="display-6 mb-4">{service17Section1Caption}</h3>
            <p className="mb-5">{service17Section1Description}</p>

            <ListColumn
              list={list1?.attrs.list}
              rowClass={list1?.attrs.rowClass}
              bulletColor={list1?.attrs.bulletColor}
            />

            <NextLink
              title={service17Section1LinkTitle}
              href={service17Section1LinkHref}
              className="btn btn-soft-leaf rounded-pill mt-6 mb-0"
            />
          </div>
        </div>

        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-6 order-lg-2 position-relative">
            <div
              className="shape rounded-circle bg-soft-primary rellax w-18 h-18"
              style={{bottom: '-2.5rem', right: '-1.5rem'}}
            />

            <figure className="rounded mb-0">
              <Image
                src={image2.url}
                alt={image2.alt}
                width={image2.width}
                height={image2.height}
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h3 className="display-6 mb-4">{service17Section2Caption}</h3>
            <p className="mb-5">{service17Section2Description}</p>

            <ListColumn
              list={list2?.attrs.list}
              rowClass={list2?.attrs.rowClass}
              bulletColor={list2?.attrs.bulletColor}
            />
            <NextLink
              title={service17Section2LinkTitle}
              href={service17Section2LinkHref}
              className="btn btn-soft-leaf rounded-pill mt-6 mb-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
