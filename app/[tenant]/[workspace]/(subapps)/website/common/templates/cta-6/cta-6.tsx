import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA6(props: TemplateProps<Cta6Data>) {
  const {data} = props;
  const {
    cta6Title: title,
    cta6LinkTitle: linkTitle,
    cta6LinkHref: linkHref,
    cta6Image,
    cta6WrapperClassName: wrapperClassName = 'text-center',
    cta6ContainerClassName: containerClassName = 'py-md-16 py-lg-18',
  } = data || {};

  const image = getMetaFileURL({
    metaFile: cta6Image,
    path: 'cta6Image',
    ...props,
  });

  return (
    <section
      className={`wrapper image-wrapper bg-auto no-overlay bg-image bg-map ${wrapperClassName}`}
      data-code={props.code}
      style={{backgroundImage: `url(${image})`}}>
      <div className={`container ${containerClassName}`}>
        <div className="row">
          <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto">
            <h3 className="display-4 mb-8 px-lg-8">{title}</h3>
          </div>

          <div className="d-flex justify-content-center">
            <span>
              <NextLink
                href={linkHref}
                title={linkTitle}
                className="btn btn-primary rounded-pill"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
