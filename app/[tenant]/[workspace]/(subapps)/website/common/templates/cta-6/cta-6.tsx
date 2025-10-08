import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta6Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA6(props: TemplateProps<Cta6Data>) {
  const {data} = props;
  const {
    cta6Title: title,
    cta6LinkTitle: linkTitle,
    cta6LinkHref: linkHref,
    cta6Image,
    cta6WrapperClassName: wrapperClassName,
    cta6ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta6Image,
    path: 'cta6Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image.url})`}}>
      <div className={containerClassName}>
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
