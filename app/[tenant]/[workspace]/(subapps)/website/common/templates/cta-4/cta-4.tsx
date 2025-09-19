import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta4Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA4(props: TemplateProps<Cta4Data>) {
  const {data} = props;
  const {
    cta4Title: title,
    cta4Caption: caption,
    cta4LinkTitle: linkTitle,
    cta4LinkHref: linkHref,
    cta4Image,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: cta4Image,
    path: 'cta4Image',
    ...props,
  });

  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay"
      style={{backgroundImage: `url(${image})`}}>
      <div className="container py-18">
        <div className="row">
          <div className="col-lg-8">
            <h2 className="fs-16 text-uppercase text-white mb-3 text-line">
              {caption}
            </h2>
            <h3 className="display-4 mb-5 mb-6 text-white pe-xxl-24">
              {title}
            </h3>

            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-white rounded mb-0 text-nowrap"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
