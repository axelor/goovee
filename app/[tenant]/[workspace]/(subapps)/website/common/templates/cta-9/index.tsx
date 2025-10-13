import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta9Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function CTA9(props: TemplateProps<Cta9Data>) {
  const {data} = props;
  const {
    cta9Title: title,
    cta9LinkTitle: linkTitle,
    cta9LinkHref: linkHref,
    cta9Image,
    cta9WrapperClassName: wrapperClassName,
    cta9ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta9Image,
    path: 'cta9Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image.url})`}}>
      <div className={containerClassName}>
        <div className="row">
          <div className="col-xl-10 col-xxl-8 mx-auto text-center">
            <i className="icn-flower text-white fs-30 opacity-50" />
            <h2 className="display-4 text-white mt-2 mb-7">{title}</h2>
            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-white rounded-pill mb-5"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
