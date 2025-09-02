import type {TemplateProps} from '@/subapps/website/common/types';
import {type Cta9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function CTA9(props: TemplateProps<Cta9Data>) {
  const {data} = props;
  const {
    cta9Title: title,
    cta9LinkTitle: linkTitle,
    cta9LinkHref: linkHref,
    cta9Image,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: cta9Image,
    path: 'cta9Image',
    ...props,
  });

  return (
    <section
      className="wrapper image-wrapper bg-image bg-overlay text-white"
      style={{backgroundImage: `url(${image})`}}>
      <div className="container py-14 py-md-17 text-center">
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
