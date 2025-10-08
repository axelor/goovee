import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact11Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';
import Image from 'next/image';

export function Contact11(props: TemplateProps<Contact11Data>) {
  const {data} = props;
  const {
    contact11Title: title,
    contact11Caption: caption,
    contact11Image,
    contact11ContactInfo: contactInfo,
    contact11WrapperClassName: wrapperClassName,
    contact11ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: contact11Image,
    path: 'contact11Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-3 gy-10 align-items-center">
          <div className="col-lg-6">
            <figure>
              <Image
                className="w-auto"
                src={image.url}
                alt={image.alt}
                width={image.width}
                height={image.height}
              />
            </figure>
          </div>

          <div className="col-lg-5 offset-lg-1">
            <h2 className="fs-16 text-uppercase text-gradient gradient-1 mb-3">
              {caption}
            </h2>
            <h3 className="display-4 mb-8">{title}</h3>
            <div className="d-flex flex-row">
              <div>
                <IconBox
                  className="icon text-primary fs-28 me-4 mt-n1"
                  icon="uil-location-pin-alt"
                />
              </div>

              <div>
                <h5 className="mb-1">{contactInfo?.attrs.addressTitle}</h5>
                <address>{contactInfo?.attrs.address}</address>
              </div>
            </div>

            <div className="d-flex flex-row">
              <div>
                <IconBox
                  className="icon text-primary fs-28 me-4 mt-n1"
                  icon="uil-phone-volume"
                />
              </div>

              <div>
                <h5 className="mb-1">{contactInfo?.attrs.phoneTitle}</h5>
                <p>{contactInfo?.attrs.phone}</p>
              </div>
            </div>

            <div className="d-flex flex-row">
              <div>
                <IconBox
                  className="icon text-primary fs-28 me-4 mt-n1"
                  icon="uil-envelope"
                />
              </div>

              <div>
                <h5 className="mb-1">{contactInfo?.attrs.emailTitle}</h5>
                <p className="mb-0">
                  <a
                    href={`mailto:${contactInfo?.attrs.email}`}
                    className="link-body">
                    {contactInfo?.attrs.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
