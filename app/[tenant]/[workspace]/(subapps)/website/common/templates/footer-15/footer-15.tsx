import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer15Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';

export function Footer15(props: TemplateProps<Footer15Data>) {
  const {data} = props;
  const {
    footer15Logo,
    footer15Title: title,
    footer15Copyright: copyright,
    footer15AddressTitle: addressTitle,
    footer15AddressLine: addressLine,
    footer15PhoneTitle: phoneTitle,
    footer15Phone1: phone1,
    footer15Phone2: phone2,
    footer15SocialLinks,
    footer15FooterClassName: footerClassName,
    footer15ContainerClassName: containerClassName,
  } = data || {};

  const logo = getMetaFileURL({
    metaFile: footer15Logo,
    path: 'footer15Logo',
    ...props,
  });

  const socialLinks =
    footer15SocialLinks?.map(socialLink => ({
      id: socialLink.id,
      icon: `uil uil-${socialLink.attrs.icon || ''}`,
      url: socialLink.attrs.url || '#',
    })) ?? [];

  return (
    <footer className={footerClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gx-lg-0 gy-6">
          <div className="col-lg-4">
            <div className="widget">
              <img className="mb-4" src={logo} alt="" />
              <p className="lead mb-0">{title}</p>
            </div>
          </div>

          <div className="col-lg-3 offset-lg-2">
            <div className="widget">
              <div className="d-flex flex-row">
                <div>
                  <div className="icon text-primary fs-28 me-4 mt-n1">
                    <i className="uil uil-phone-volume" />
                  </div>
                </div>

                <div>
                  <h5 className="mb-1">{phoneTitle}</h5>
                  <p className="mb-0">
                    {phone1} <br />
                    {phone2}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-3">
            <div className="widget">
              <div className="d-flex flex-row">
                <div>
                  <div className="icon text-primary fs-28 me-4 mt-n1">
                    <i className="uil uil-location-pin-alt" />
                  </div>
                </div>

                <div className="align-self-start justify-content-start">
                  <h5 className="mb-1">{addressTitle}</h5>
                  <address>{addressLine}</address>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="mt-11 mt-md-12 mb-7" />
        <div className="d-md-flex align-items-center justify-content-between">
          <p className="mb-2 mb-lg-0">{copyright}</p>
          <SocialLinks
            links={socialLinks}
            className="nav social social-muted mb-0 text-md-end"
          />
        </div>
      </div>
    </footer>
  );
}
