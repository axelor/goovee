import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Contact2Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';

export default function Contact2(props: TemplateProps<Contact2Data>) {
  const {data} = props;
  const {
    contact2Title: title,
    contact2Description1: description1,
    contact2Description2: description2,
    contact2LinkTitle: linkTitle,
    contact2LinkHref: linkHref,
    contact2Image,
    contact2WrapperClassName: wrapperClassName,
    contact2ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: contact2Image,
    path: 'contact2Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-0">
          <div className="col-lg-6 image-wrapper rounded-top rounded-lg-start d-none d-md-block overflow-hidden">
            <Image
              src={image.url}
              alt={image.alt || 'contact background'}
              fill
              className="object-cover"
            />
          </div>

          <div className="col-lg-6">
            <div className="p-10 p-md-11 p-lg-13">
              <h2 className="display-4 mb-3">{title}</h2>

              <p className="lead fs-lg">{description1}</p>

              <p>{description2}</p>

              <NextLink
                title={linkTitle}
                href={linkHref}
                className="btn btn-primary rounded-pill mt-2"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
