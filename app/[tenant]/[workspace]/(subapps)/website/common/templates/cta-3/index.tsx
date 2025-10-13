import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Cta3Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function CTA3(props: TemplateProps<Cta3Data>) {
  const {data} = props;
  const {
    cta3Title: title,
    cta3Description: description,
    cta3LinkTitle: linkTitle,
    cta3LinkHref: linkHref,
    cta3Image,
    cta3WrapperClassName: wrapperClassName,
    cta3ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: cta3Image,
    path: 'cta3Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <Image
        src={image.url}
        alt={image.alt || 'CTA background'}
        fill
        className="object-cover"
      />
      <div className={containerClassName}>
        <div className="row">
          <div className="col-lg-7 col-xl-7 mx-auto">
            <h2 className="display-4 mb-3 text-center">{title}</h2>
            <p
              className="lead mb-5 px-md-16 px-lg-3"
              dangerouslySetInnerHTML={{
                __html: description || '',
              }}
            />
            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-primary rounded-pill"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
