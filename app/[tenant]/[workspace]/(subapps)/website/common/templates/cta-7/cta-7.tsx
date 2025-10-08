import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Cta7Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA7(props: TemplateProps<Cta7Data>) {
  const {data} = props;
  const {
    cta7Title: title,
    cta7Caption: caption,
    cta7LinkTitle: linkTitle,
    cta7LinkHref: linkHref,
    cta7Image,
    cta7SectionClassName: sectionClassName,
    cta7ContainerCardClassName: containerCardClassName,
    cta7CardClassName: cardClassName,
    cta7CardBodyClassName: cardBodyClassName,
    cta7ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta7Image,
    path: 'cta7Image',
    ...props,
  });

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className={containerCardClassName}>
        <div className={cardClassName}>
          <Image
            src={image.url}
            alt={image.alt || 'CTA background'}
            fill
            className="object-fit-cover"
          />
          <div
            className="position-absolute top-0 left-0 w-100 h-100 bg-white opacity-50"
            style={{zIndex: 1}}></div>
          <div className={cardBodyClassName} style={{zIndex: 2}}>
            <div className={containerClassName}>
              <div className="row text-center">
                <div className="col-md-7 col-lg-9 col-xl-8 col-xxl-7 mx-auto">
                  <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
                    {caption}
                  </h2>
                  <h3 className="display-4 mb-7 px-lg-17">{title}</h3>
                </div>
              </div>

              <div className="d-flex justify-content-center">
                <span>
                  <NextLink
                    href={linkHref}
                    title={linkTitle}
                    className="btn btn-lg btn-gradient gradient-1 rounded"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
