import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer14Data} from './meta';
import {getImage} from '../../utils/helper';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export function Footer14(props: TemplateProps<Footer14Data>) {
  const {data} = props;
  const {
    footer14Logo,
    footer14BackgroundImage,
    footer14Title: title,
    footer14LinkTitle: linkTitle,
    footer14LinkHref: linkHref,
    footer14Copyright: copyright,
    footer14AddressTitle: addressTitle,
    footer14AddressLine: addressLine,
    footer14Email: email,
    footer14Phone: phone,
    footer14ListTitle: listTitle,
    footer14NewsletterTitle: newsletterTitle,
    footer14NewsletterDescription: newsletterDescription,
    footer14Links: links,
    footer14SocialLinks,
    footer14FooterClassName: footerClassName,
    footer14ContainerClassName: containerClassName,
  } = data || {};

  const logo = getImage({
    image: footer14Logo,
    path: 'footer14Logo',
    ...props,
  });

  const backgroundImage = getImage({
    image: footer14BackgroundImage,
    path: 'footer14BackgroundImage',
    ...props,
  });

  const socialLinks =
    footer14SocialLinks?.map(socialLink => ({
      id: socialLink.id,
      icon: `uil uil-${socialLink.attrs.icon || ''}`,
      url: socialLink.attrs.url || '#',
    })) ?? [];

  return (
    <footer className={footerClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="card image-wrapper bg-full mt-n50p mx-md-5 overflow-hidden position-relative">
          <Image
            src={backgroundImage.url}
            alt={backgroundImage.alt || 'Footer background'}
            fill
            className="object-fit-cover"
          />
          <div
            className="position-absolute top-0 left-0 w-100 h-100 bg-dark opacity-50"
            style={{zIndex: 1}}></div>
          <div
            className="card-body p-6 p-md-11 d-lg-flex flex-row align-items-lg-center justify-content-md-between text-center text-lg-start position-relative"
            style={{zIndex: 2}}>
            <h3 className="display-4 mb-6 mb-lg-0 pe-lg-10 pe-xl-5 pe-xxl-15 text-white">
              {title}
            </h3>
            <NextLink
              href={linkHref}
              title={linkTitle}
              className="btn btn-lg btn-white rounded mb-0 text-nowrap"
            />
          </div>
        </div>

        <div className="text-inverse mx-md-5 mt-n15 mt-lg-0">
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
                <h4 className="widget-title text-white mb-3">{listTitle}</h4>
                <ul className="list-unstyled text-reset mb-0">
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
      </div>
    </footer>
  );
}
