import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Cta2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function CTA2(props: TemplateProps<Cta2Data>) {
  const {data} = props;
  const {
    cta2Title: title,
    cta2LinkTitle1: linkTitle1,
    cta2LinkTitle2: linkTitle2,
    cta2LinkHref1: linkHref1,
    cta2LinkHref2: linkHref2,
    cta2Image,
    cta2WrapperClassName: wrapperClassName,
    cta2ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta2Image,
    path: 'cta2Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <Image
        src={image.url}
        alt={image.alt || 'CTA background'}
        fill
        className="object-fit-contain"
      />
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-10 col-xl-9 col-xxl-8 mx-auto">
            <h3 className="display-4 mb-8 px-lg-17">{title}</h3>
          </div>
        </div>

        <div className="d-flex justify-content-center">
          <NextLink
            href={linkHref1}
            title={linkTitle1}
            className="btn btn-primary rounded mx-1"
          />
          <NextLink
            href={linkHref2}
            title={linkTitle2}
            className="btn btn-green rounded mx-1"
          />
        </div>
      </div>
    </section>
  );
}
