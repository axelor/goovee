import type {TemplateProps} from '@/subapps/website/common/types';
import {type Hero14Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Hero14(props: TemplateProps<Hero14Data>) {
  const {data} = props;
  const {
    hero14Title: title,
    hero14Description: description,
    hero14LinkTitle: linkTitle,
    hero14LinkHref: linkHref,
    hero14Image,
    hero14WrapperClassName: wrapperClassName,
    hero14ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero14Image,
    path: 'hero14Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-md-8 gx-lg-12 gy-3 gy-lg-0 mb-13">
          <div className="col-lg-6">
            <h1 className="display-1 fs-66 lh-xxs mb-0">{title}</h1>
          </div>

          <div className="col-lg-6">
            <p className="lead fs-23 my-3">{description}</p>

            <NextLink
              title={linkTitle}
              href={linkHref}
              className="more hover"
            />
          </div>
        </div>

        <div className="position-relative">
          <div
            className="shape bg-dot primary rellax w-17 h-21"
            style={{top: '-2.5rem', right: '-2.7rem'}}
          />

          <figure className="rounded mb-md-n20">
            <img src={image} alt="" />
          </figure>
        </div>
      </div>
    </section>
  );
}
