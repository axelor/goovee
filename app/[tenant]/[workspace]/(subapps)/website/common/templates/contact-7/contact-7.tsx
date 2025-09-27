import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact7Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';

export function Contact7(props: TemplateProps<Contact7Data>) {
  const {data} = props;
  const {
    contact7Title: title,
    contact7Image,
    contact7ContactInfo: contactInfo,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact7Image,
    path: 'contact7Image',
    ...props,
  });

  return (
    <section className="wrapper bg-light angled upper-end lower-end">
      <div className="container pt-18 pb-14 pt-md-19 pb-md-16">
        <div className="row gx-md-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-md-8 col-lg-6 offset-lg-0 col-xl-5 offset-xl-1 position-relative">
            <div
              className="shape bg-dot primary rellax w-17 h-21"
              style={{top: '-2rem', left: '-1.4rem'}}
            />

            <figure className="rounded">
              <img src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-6">
            <h2 className="display-4 mb-8">{title}</h2>
            <div className="d-flex flex-row">
              <div>
                <IconBox
                  className="icon text-primary fs-28 me-6 mt-n1"
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
                  className="icon text-primary fs-28 me-6 mt-n1"
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
                  className="icon text-primary fs-28 me-6 mt-n1"
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
