// -------- custom component -------- //
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
// -------- data -------- //
import type {TemplateProps} from '../../types';
import type {Footer1Data} from './meta';
import {getMetaFileURL} from '../../utils/helper';

export function Footer1(props: TemplateProps<Footer1Data>) {
  const {data} = props;
  const {
    footer1Title: title,
    footer1ButtonLink: buttonLink,
    footer1ButtonText: buttonText,
    footer1CopyrightText: copyrightText,
    footer1Logo,
    footer1SocialLinks,
    footer1AddressTitle: addressTitle,
    footer1Address: address,
    footer1Email: email,
    footer1Phone: phone,
    footer1NavTitle: navTitle,
    footer1NavLinks: navLinks,
    footer1FormTitle: formTitle,
    footer1FormDescription: formDescription,
    footer1FooterClassName: footerClassName = 'bg-navy text-inverse',
    footer1ContainerClassName:
      containerClassName = 'pt-15 pt-md-17 pb-13 pb-md-15',
  } = data || {};

  const logo = getMetaFileURL({
    metaFile: footer1Logo,
    path: 'footer1Logo',
    ...props,
  });

  const socialLinks = footer1SocialLinks?.map(socialLink => ({
    id: socialLink.id,
    icon: `uil uil-${socialLink.attrs.icon || ''}`,
    url: socialLink.attrs.url || '#',
  }));

  return (
    <footer className={`footer ${footerClassName}`} data-code={props.code}>
      <div className={`container ${containerClassName}`}>
        <div className="d-lg-flex flex-row align-items-lg-center">
          <h3 className="display-4 mb-6 mb-lg-0 pe-lg-20 pe-xl-22 pe-xxl-25 text-white">
            {title}
          </h3>

          <NextLink
            href={buttonLink || '#'}
            title={buttonText || 'Try It For Free'}
            className="btn btn-primary rounded-pill mb-0 text-nowrap"
          />
        </div>

        <hr className="mt-11 mb-12" />

        <div className="row gy-6 gy-lg-0">
          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <img className="mb-4" src={logo} alt="logo" />

              <p
                className="mb-4"
                dangerouslySetInnerHTML={{__html: copyrightText || ''}}
              />
              <SocialLinks
                links={socialLinks || []}
                className="nav social social-white"
              />
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{addressTitle}</h4>
              <address className="pe-xl-15 pe-xxl-17">{address}</address>
              {email && <NextLink title={email} href={`mailto:${email}`} />}
              <br /> {phone && <NextLink title={phone} href={`tel:${phone}`} />}
            </div>
          </div>

          <div className="col-md-4 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{navTitle}</h4>
              <ul className="list-unstyled  mb-0">
                {navLinks?.map(({id, attrs: {title, url}}) => (
                  <li key={id}>
                    <NextLink title={title} href={url} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-md-12 col-lg-3">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{formTitle}</h4>
              <p className="mb-5">{formDescription}</p>
              {
                //TODO: figure out how add newsletter form
              }
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
