import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer2Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
import {getMetaFileURL} from '../../utils/helper';

export function Footer2(props: TemplateProps<Footer2Data>) {
  const {data} = props;
  const {
    footer2ContactTitle: contactTitle,
    footer2ContactDescription1: contactDescription1,
    footer2ContactDescription2: contactDescription2,
    footer2ContactLinkHref: contactLinkHref,
    footer2ContactLinkTitle: contactLinkTitle,
    footer2ContactImage,
    footer2AddressTitle: addressTitle,
    footer2AddressLine1: addressLine1,
    footer2AddressLine2: addressLine2,
    footer2PhoneTitle: phoneTitle,
    footer2Phone1: phone1,
    footer2Phone2: phone2,
    footer2EmailTitle: emailTitle,
    footer2Email1: email1,
    footer2Email2: email2,
    footer2Copyright: copyright,
    footer2SocialLinks,
    footer2FooterClassName: footerClassName,
    footer2SectionClassName: sectionClassName,
  } = data || {};

  const contactImage = getMetaFileURL({
    metaFile: footer2ContactImage,
    path: 'footer2ContactImage',
    ...props,
  });

  const socialLinks = footer2SocialLinks?.map(socialLink => ({
    id: socialLink.id,
    icon: `uil uil-${socialLink.attrs.icon || ''}`,
    url: socialLink.attrs.url || '#',
  }));

  return (
    <section className={sectionClassName} data-code={props.code}>
      <div className="container position-relative z-10">
        <div className="card shadow-lg mx-auto position-relative">
          <div className="row gx-0">
            <div
              className="col-lg-6 image-wrapper bg-image bg-cover rounded-top rounded-lg-start d-none d-md-block"
              style={{backgroundImage: `url(${contactImage})`}}
            />
            <div className="col-lg-6">
              <div className="p-10 p-md-11 p-lg-13">
                <h2 className="display-4 mb-3">{contactTitle}</h2>
                <p className="lead fs-lg">{contactDescription1}</p>
                <p>{contactDescription2}</p>
                <NextLink
                  title={contactLinkTitle}
                  href={contactLinkHref}
                  className="btn btn-primary rounded-pill mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className={footerClassName}>
        <div className="container text-center">
          <div className="row">
            <div className="col-md-4">
              <h4 className="widget-title">{addressTitle}</h4>
              <address>
                {addressLine1} <br className="d-none d-md-block" />{' '}
                {addressLine2}
              </address>
            </div>
            <div className="col-md-4">
              <h4 className="widget-title">{phoneTitle}</h4>
              {phone1 && <NextLink title={phone1} href={`tel:${phone1}`} />}
              {phone2 && (
                <>
                  <br /> <NextLink title={phone2} href={`tel:${phone2}`} />
                </>
              )}
            </div>
            <div className="col-md-4">
              <h4 className="widget-title">{emailTitle}</h4>
              {email1 && (
                <NextLink
                  title={email1}
                  href={`mailto:${email1}`}
                  className="link-body"
                />
              )}
              {email2 && (
                <>
                  <br className="d-none d-md-block" />{' '}
                  <NextLink
                    title={email2}
                    href={`mailto:${email2}`}
                    className="link-body"
                  />
                </>
              )}
            </div>
          </div>
          <p className="mt-6">{copyright}</p>
          <SocialLinks
            links={socialLinks || []}
            className="nav social justify-content-center"
          />
        </div>
      </footer>
    </section>
  );
}
