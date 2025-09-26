import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact1Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';

export function Contact1(props: TemplateProps<Contact1Data>) {
  const {data} = props;
  const {
    contact1Title: title,
    contact1Caption: caption,
    contact1Image,
    contact1ContactInfo: contactInfo,
    contact1WrapperClassName: wrapperClassName,
    contact1ContainerClassName: containerClassName,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact1Image,
    path: 'contact1Image',
    ...props,
  });

  return (
    <section className={wrapperClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-10 gy-sm-13 gx-lg-3 align-items-center">
          <div className="col-md-8 col-lg-6 position-relative">
            <div
              className="shape bg-dot primary rellax w-17 h-21"
              style={{top: '-2rem', left: '-1.9rem'}}
            />
            <div
              className="shape rounded bg-soft-primary rellax d-md-block"
              style={{
                width: '85%',
                height: '90%',
                right: '-1.5rem',
                bottom: '-1.8rem',
              }}
            />

            <figure className="rounded">
              <img src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-5 col-xl-4 offset-lg-1">
            <h2 className="fs-16 text-uppercase text-line text-primary mb-3">
              {caption}
            </h2>
            <h2 className="display-4 mb-8">{title}</h2>

            <div className="d-flex flex-row">
              <div>
                <div className="icon text-primary fs-28 me-6 mt-n1">
                  <i className="uil uil-location-pin-alt" />
                </div>
              </div>

              <div>
                <h5 className="mb-1">{contactInfo?.attrs.addressTitle}</h5>
                <address>{contactInfo?.attrs.address}</address>
              </div>
            </div>

            <div className="d-flex flex-row">
              <div>
                <div className="icon text-primary fs-28 me-6 mt-n1">
                  <i className="uil uil-phone-volume" />
                </div>
              </div>
              <div>
                <h5 className="mb-1">{contactInfo?.attrs.phoneTitle}</h5>
                <p>{contactInfo?.attrs.phone}</p>
              </div>
            </div>

            <div className="d-flex flex-row">
              <div>
                <div className="icon text-primary fs-28 me-6 mt-n1">
                  <i className="uil uil-envelope" />
                </div>
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
