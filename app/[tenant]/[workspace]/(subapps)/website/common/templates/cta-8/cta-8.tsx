import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta8Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA8(props: TemplateProps<Cta8Data>) {
  const {data} = props;
  const {
    cta8Title: title,
    cta8Caption: caption,
    cta8LinkTitle: linkTitle,
    cta8LinkHref: linkHref,
    cta8Image,
    cta8WrapperClassName: wrapperClassName,
    cta8ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta8Image,
    path: 'cta8Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div
        className={containerClassName}
        style={{backgroundImage: `url(${image.url})`}}>
        <div className="card-body p-10 p-xl-12">
          <div className="row text-center">
            <div className="col-lg-9 col-xl-8 col-xxl-7 mx-auto">
              <h2 className="fs-16 text-uppercase text-white mb-3">
                {caption}
              </h2>
              <h3 className="display-3 mb-8 px-lg-8 text-white">{title}</h3>
            </div>
          </div>

          <div className="d-flex justify-content-center">
            <span>
              <NextLink
                href={linkHref}
                title={linkTitle}
                className="btn btn-white rounded"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
