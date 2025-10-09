import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact9Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export function Contact9(props: TemplateProps<Contact9Data>) {
  const {data} = props;
  const {
    contact9Title: title,
    contact9Caption: caption,
    contact9LinkTitle: linkTitle,
    contact9LinkHref: linkHref,
    contact9Image,
    contact9WrapperClassName: wrapperClassName,
    contact9ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact9Image,
    path: 'contact9Image',
    ...props,
  });

  return (
    <section
      className={wrapperClassName}
      data-code={props.code}
      style={{backgroundImage: `url(${image})`}}>
      <div className={containerClassName}>
        <div className="row text-center">
          <div className="col-md-8 col-lg-7 col-xl-5 mx-auto">
            <h2 className="fs-16 text-uppercase text-white mb-3">{caption}</h2>
            <h3 className="display-4 mb-6 text-white px-lg-5 px-xxl-0">
              {title}
            </h3>

            <NextLink
              title={linkTitle}
              href={linkHref}
              className="btn btn-white rounded-pill mb-0 text-nowrap"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
