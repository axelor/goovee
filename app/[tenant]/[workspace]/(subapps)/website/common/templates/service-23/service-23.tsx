import type {TemplateProps} from '@/subapps/website/common/types';
import {type Service23Data} from './meta';
import {
  getImage,
  getPaddingBottom,
} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Service23(props: TemplateProps<Service23Data>) {
  const {data} = props;
  const {
    service23Caption: caption,
    service23Title: title,
    service23Section1Title,
    service23Section1Description,
    service23Section1LinkTitle,
    service23Section1LinkHref,
    service23Section1Image,
    service23Section1Services,
    service23Section2Title,
    service23Section2Description,
    service23Section2LinkTitle,
    service23Section2LinkHref,
    service23Section2Image,
    service23Section2Services,
    service23Section3Title,
    service23Section3Description,
    service23Section3LinkTitle,
    service23Section3LinkHref,
    service23Section3Image,
    service23Section3Services,
    service23WrapperClassName: wrapperClassName,
    service23ContainerClassName: containerClassName,
  } = data || {};

  const image1 = getImage({
    image: service23Section1Image,
    path: 'service23Section1Image',
    ...props,
  });

  const image2 = getImage({
    image: service23Section2Image,
    path: 'service23Section2Image',
    ...props,
  });

  const image3 = getImage({
    image: service23Section3Image,
    path: 'service23Section3Image',
    ...props,
  });

  const list1 = service23Section1Services?.map(item => item.attrs.title) || [];
  const list2 = service23Section2Services?.map(item => item.attrs.title) || [];
  const list3 = service23Section3Services?.map(item => item.attrs.title) || [];

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row text-center mb-10">
          <div className="col-md-10 col-lg-9 col-xxl-8 mx-auto">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{caption}</h2>
            <h3 className="display-3 px-xl-10 mb-0">{title}</h3>
          </div>
        </div>

        <div className="row gx-lg-0 gy-10 mb-15 mb-md-17 align-items-center">
          <div className="col-lg-6">
            <figure
              className="rounded mb-0 position-relative"
              style={{paddingBottom: getPaddingBottom(image1)}}>
              <Image
                className="img-fluid object-fit-cover"
                src={image1.url}
                alt={image1.alt}
                fill
              />
            </figure>
          </div>

          <ColumnTwo
            title={service23Section1Title}
            description={service23Section1Description}
            list={list1}
            linkTitle={service23Section1LinkTitle}
            linkHref={service23Section1LinkHref}
            className="ms-auto"
          />
        </div>

        <div className="row gx-lg-0 gy-10 mb-15 mb-md-17 align-items-center">
          <div className="col-lg-6 order-lg-2 ms-auto">
            <figure
              className="rounded mb-0 position-relative"
              style={{paddingBottom: getPaddingBottom(image2)}}>
              <Image
                className="img-fluid object-fit-cover"
                src={image2.url}
                alt={image2.alt}
                fill
              />
            </figure>
          </div>

          <ColumnTwo
            title={service23Section2Title}
            description={service23Section2Description}
            list={list2}
            linkTitle={service23Section2LinkTitle}
            linkHref={service23Section2LinkHref}
          />
        </div>

        <div className="row gx-lg-0 gy-10 align-items-center">
          <div className="col-lg-6">
            <figure
              className="rounded mb-0 position-relative"
              style={{paddingBottom: getPaddingBottom(image3)}}>
              <Image
                className="img-fluid object-fit-cover"
                src={image3.url}
                alt={image3.alt}
                fill
              />
            </figure>
          </div>

          <ColumnTwo
            title={service23Section3Title}
            description={service23Section3Description}
            list={list3}
            linkTitle={service23Section3LinkTitle}
            linkHref={service23Section3LinkHref}
            className="ms-auto"
          />
        </div>
      </div>
    </section>
  );
}

const ColumnTwo = ({
  title,
  description,
  list,
  linkTitle,
  linkHref,
  className = '',
}: any) => {
  return (
    <div className={`col-lg-5 ${className}`}>
      <h3 className="fs-28 mb-3">{title}</h3>
      <p>{description}</p>

      <ul className="icon-list bullet-bg bullet-soft-primary">
        {list.map((item: string) => (
          <li key={item}>
            <i className="uil uil-check" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <NextLink
        title={linkTitle}
        href={linkHref}
        className="btn btn-soft-primary rounded-pill mt-2"
      />
    </div>
  );
};
