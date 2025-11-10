import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer8Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export default function Footer8(props: TemplateProps<Footer8Data>) {
  const {data} = props;
  const {
    footer8Logo,
    footer8Copyright: copyright,
    footer8AddressTitle: addressTitle,
    footer8AddressLine: addressLine,
    footer8Email: email,
    footer8Phone: phone,
    footer8LinkTitle: linkTitle,
    footer8NewsletterTitle: newsletterTitle,
    footer8NewsletterDescription: newsletterDescription,
    footer8Links: links,
    footer8SocialLinks,
    footer8FooterClassName: footerClassName,
    footer8ContainerClassName: containerClassName,
  } = data || {};

  const logo = getImage({
    image: footer8Logo,
    path: 'footer8Logo',
    ...props,
  });

  const socialLinks =
    footer8SocialLinks?.map(socialLink => ({
      id: socialLink.id,
      icon: `uil uil-${socialLink.attrs.icon || ''}`,
      url: socialLink.attrs.url || '#',
    })) ?? [];

  return (
    <footer className={footerClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="row gy-6 gy-lg-0">
          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <Image
                className="mb-4"
                src={logo.url}
                alt={logo.alt}
                width={logo.width}
                height={logo.height}
              />

              <p className="mb-4">{copyright}</p>

              <SocialLinks
                links={socialLinks}
                className="nav social social-white"
              />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{addressTitle}</h4>
              <address className="pe-xl-15 pe-xxl-17">{addressLine}</address>
              <NextLink title={email} href={`mailto:${email}`} />
              <br /> {phone}
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{linkTitle}</h4>
              <ul className="list-unstyled mb-0">
                {links?.map(({id, attrs: {title, url}}) => (
                  <li key={id}>
                    <NextLink title={title} href={url} />
                  </li>
                ))}
              </ul>
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
      </div>
    </footer>
  );
}
