import type {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

import type {Hero1Data} from './meta.ts';

export function Hero1(props: TemplateProps<Hero1Data>) {
  const {data} = props;
  const {
    hero1Title: title,
    hero1Description: description,
    hero1ButtonText: buttonText,
    hero1ButtonLink: buttonLink,
    hero1Image,
    hero1WrapperClassName: wrapperClassName,
    hero1ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: hero1Image,
    path: `hero1Image`,
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-md-10 offset-md-1 offset-lg-0 col-lg-6 text-center text-lg-start">
            <h1 className="display-1 mb-5 mx-md-n5 mx-lg-0">{title}</h1>
            {description && <p className="lead fs-lg mb-7">{description}</p>}
            {buttonText && (
              <a
                className="btn btn-primary rounded-pill me-2"
                href={buttonLink ?? '#'}>
                {buttonText}
              </a>
            )}
          </div>

          <div className="col-lg-6">
            {image && (
              <figure>
                <img alt="hero" className="w-auto" src={image} />
              </figure>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
