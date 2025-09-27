import type {TemplateProps} from '@/subapps/website/common/types';
import {type Contact6Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import IconBox from '@/subapps/website/common/components/reuseable/IconBox';

export function Contact6(props: TemplateProps<Contact6Data>) {
  const {data} = props;
  const {
    contact6Title: title,
    contact6Image,
    contact6ContactInfo: contactInfo,
  } = data || {};

  const image = getMetaFileURL({
    metaFile: contact6Image,
    path: 'contact6Image',
    ...props,
  });

  return (
    <section className="wrapper bg-soft-primary">
      <div className="container py-14 py-md-17">
        <div className="row gx-lg-8 gx-xl-12 gy-10 align-items-center">
          <div className="col-lg-7">
            <figure>
              <img className="w-auto" src={image} alt="" />
            </figure>
          </div>

          <div className="col-lg-5">
            <h3 className="display-4 mb-7">{title}</h3>
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
