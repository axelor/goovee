import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta7Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
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

  const image = getMetaFileURL({
    metaFile: cta7Image,
    path: 'cta7Image',
    ...props,
  });

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className={containerCardClassName}>
        <div
          className={cardClassName}
          style={{backgroundImage: `url(${image})`}}>
          <div className={cardBodyClassName}>
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
