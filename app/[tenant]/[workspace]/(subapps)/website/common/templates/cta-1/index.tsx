import {TemplateProps} from '@/subapps/website/common/types';
import {getImage} from '@/subapps/website/common/utils/helper';
import Image from 'next/image';

import type {Cta1Data} from './meta.ts';

export default function CTA1(props: TemplateProps<Cta1Data>) {
  const {data} = props;
  const {
    cta1Title: title,
    cta1Caption: caption,
    cta1Description: description,
    cta1Image,
    cta1WrapperClassName: wrapperClassName,
    cta1ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta1Image,
    path: `cta1Image`,
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-8 align-items-center">
          <div className="col-lg-6 order-lg-2">
            <figure>
              <Image
                alt={image.alt}
                className="w-auto"
                src={image.url}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="fs-16 text-uppercase text-muted mb-3">{title}</h2>
            <h3 className="display-4 mb-5">{caption}</h3>

            <p className="mb-7">{description}</p>
            {/* TODO: use jot form */}
            <div className="row">
              <div className="col-lg-9">
                <form action="#">
                  <div className="form-floating input-group">
                    <input
                      type="url"
                      className="form-control"
                      placeholder="Enter Website URL"
                      id="seo-check"
                    />
                    <label htmlFor="seo-check">Enter Website URL</label>
                    <button className="btn btn-primary" type="button">
                      Check
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
