import {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

import type {Cta1Data} from './meta.ts';

export function CTA1(props: TemplateProps<Cta1Data>) {
  const {data} = props;
  const {
    cta1Title: title,
    cta1Caption: caption,
    cta1Description: description,
    cta1Image,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: cta1Image,
    path: `cta1Image`,
    ...props,
  });

  return (
    <section className="wrapper bg-gradient-reverse-primary">
      <div className="container py-16 py-md-18">
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-8 align-items-center">
          <div className="col-lg-6 order-lg-2">
            <figure>
              <img alt="analyze now" className="w-auto" src={image} />
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
