import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import {TemplateProps} from '@/subapps/website/common/types';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

import type {Contact4Data} from './meta.ts';

export function Contact4(props: TemplateProps<Contact4Data>) {
  const {data} = props;
  const {
    contact4Title: title,
    contact4Caption: caption,
    contact4Description: description,
    contact4LinkText: linkText,
    contact4LinkUrl: linkUrl,
    contact4Image,
    contact4WrapperClassName: wrapperClassName,
    contact4ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact4Image,
    path: `contact4Image`,
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-8 gx-xl-12 gy-10 mb-10 mb-md-14 align-items-center">
          <div className="col-lg-6">
            <figure>
              <img alt="contact" className="w-auto" src={image} />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="fs-16 text-uppercase text-muted mb-3 ">{title}</h2>
            <h3 className="display-4 mb-5 ">{caption}</h3>

            <p>{description}</p>
            {linkText && (
              <NextLink
                title={linkText}
                href={linkUrl || '#'}
                className="btn btn-primary rounded-pill mt-2"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
