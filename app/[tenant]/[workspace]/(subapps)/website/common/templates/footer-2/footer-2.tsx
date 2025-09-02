import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer2Data} from './meta';
import {getMetaFileURL} from '@/subapps/website/common/utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';

export function Footer2(props: TemplateProps<Footer2Data>) {
  const {data} = props;
  const {
    footer2Copyright: copyright,
    footer2AddressTitle: addressTitle,
    footer2BackgroundImage,
    footer2Caption: caption,
    footer2Para1: para1,
    footer2Para2: para2,
    footer2LinkTitle: linkTitle,
    footer2AddressLine: addressLine,
    footer2Email1: email1,
    footer2Email2: email2,
    footer2Phone1: phone1,
    footer2Phone2: phone2,
    footer2LinkHref1: linkHref1,
    footer2NewsletterTitle: newsletterTitle,
    footer2NewsletterDescription: newsletterDescription,
    footer2SocialLinks,
  } = data || {};

  const backgroundImage = getMetaFileURL({
    metaFile: footer2BackgroundImage,
    path: 'footer2BackgroundImage',
    ...props,
  });

  const socialLinks =
    footer2SocialLinks?.map(socialLink => ({
      id: socialLink.id,
      icon: `uil uil-${socialLink.attrs.icon || ''}`,
      url: socialLink.attrs.url || '#',
    })) ?? [];

  return (
    <footer
      className="wrapper image-wrapper bg-image bg-overlay"
      style={{backgroundImage: `url(${backgroundImage})`}}>
      <div className="container py-13 py-md-15">
        <div className="row gy-6 gy-lg-0">
          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{caption}</h4>
              <p className="mb-4">{para1}</p>
              <p className="mb-4">{para2}</p>
              <NextLink
                href={linkHref1}
                title={linkTitle}
                className="btn btn-primary rounded-pill"
              />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{addressTitle}</h4>
              <address className="pe-xl-15 pe-xxl-17">{addressLine}</address>
              <NextLink title={email1} href={`mailto:${email1}`} />
              <br />
              <NextLink title={email2} href={`mailto:${email2}`} />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">Our Office</h4>
              <address className="pe-xl-15 pe-xxl-17">{addressLine}</address>
              <NextLink title={phone1} href={`tel:${phone1}`} />
              <br />
              <NextLink title={phone2} href={`tel:${phone2}`} />
            </div>
          </div>

          <div className="col-md-12 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">
                {newsletterTitle}
              </h4>
              <p className="mb-5">{newsletterDescription}</p>
              <div className="newsletter-wrapper">
                <div id="mc_embed_signup2">
                  <form
                    method="post"
                    target="_blank"
                    className="validate dark-fields"
                    id="mc-embedded-subscribe-form2"
                    name="mc-embedded-subscribe-form"
                    action="https://elemisfreebies.us20.list-manage.com/subscribe/post?u=aa4947f70a475ce162057838d&amp;id=b49ef47a9a">
                    <div id="mc_embed_signup_scroll2">
                      <div className="mc-field-group input-group form-floating">
                        <input
                          type="email"
                          name="EMAIL"
                          id="mce-EMAIL2"
                          placeholder="Email Address"
                          className="required email form-control"
                        />
                        <label htmlFor="mce-EMAIL2">Email Address</label>
                        <input
                          value="Join"
                          type="submit"
                          name="subscribe"
                          id="mc-embedded-subscribe2"
                          className="btn btn-primary"
                        />
                      </div>

                      <div id="mce-responses2" className="clear">
                        <div
                          className="response"
                          id="mce-error-response2"
                          style={{display: 'none'}}
                        />
                        <div
                          className="response"
                          id="mce-success-response2"
                          style={{display: 'none'}}
                        />
                      </div>

                      <div
                        style={{position: 'absolute', left: '-5000px'}}
                        aria-hidden="true">
                        <input
                          type="text"
                          tabIndex={-1}
                          name="b_ddc180777a163e0f9f66ee014_4b1bcfa0bc"
                        />
                      </div>

                      <div className="clear" />
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 mb-0 text-center">
          <small>{copyright}</small>
        </p>
        <SocialLinks
          links={socialLinks}
          className="nav social social-white mt-4"
        />
      </div>
    </footer>
  );
}
