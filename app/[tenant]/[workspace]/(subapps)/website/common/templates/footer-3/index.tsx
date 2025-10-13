import type {TemplateProps} from '@/subapps/website/common/types';
import Image from 'next/image';
import {type Footer3Data} from './meta';
import {getImage} from '../../utils/helper';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';

export default function Footer3(props: TemplateProps<Footer3Data>) {
  const {data} = props;
  const {
    footer3Image,
    footer3NewsletterTitle: newsletterTitle,
    footer3NewsletterDescription: newsletterDescription,
    footer3Title: title,
    footer3Description: description,
    footer3LinkTitle: linkTitle,
    footer3LinkHref: linkHref,
    footer3AddressTitle: addressTitle,
    footer3AddressLine: addressLine,
    footer3Email: email,
    footer3Phone: phone,
    footer3Copyright: copyright,
    footer3ListTitle1: listTitle1,
    footer3ListTitle2: listTitle2,
    footer3Helps: helps,
    footer3LearnMore: learnMore,
    footer3SocialLinks,
    footer3FooterClassName: footerClassName,
    footer3ContainerClassName: containerClassName,
  } = data || {};

  const image = getImage({
    image: footer3Image,
    path: 'footer3Image',
    ...props,
  });

  const socialLinks =
    footer3SocialLinks?.map(socialLink => ({
      id: socialLink.id,
      icon: `uil uil-${socialLink.attrs.icon || ''}`,
      url: socialLink.attrs.url || '#',
    })) ?? [];

  const widget = (list: any[], title: string) => {
    return (
      <div className="widget">
        <h4 className="widget-title text-white mb-3">{title}</h4>
        <ul className="list-unstyled text-reset mb-0">
          {list.map(({id, attrs: {title, url}}) => (
            <li key={id}>
              <NextLink href={url} title={title} />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <footer className={footerClassName} data-code={props.code}>
      <div className={containerClassName}>
        <div className="card image-wrapper bg-full mb-13 overflow-hidden position-relative">
          <Image
            src={image.url}
            alt={image.alt || 'Footer background'}
            fill
            className="object-fit-cover"
          />
          <div
            className="position-absolute top-0 left-0 w-100 h-100 bg-dark opacity-40"
            style={{zIndex: 1}}></div>
          <div
            className="card-body p-9 p-xl-11 position-relative"
            style={{zIndex: 2}}>
            <div className="row align-items-center gy-6">
              <div className="col-lg-7">
                <h3 className="display-5 text-white">{newsletterTitle}</h3>
                <p className="lead pe-lg-12 mb-0 text-white">
                  {newsletterDescription}
                </p>
              </div>

              <div className="col-lg-5 col-xl-4 offset-xl-1">
                <div className="newsletter-wrapper">
                  <div id="mc_embed_signup2">
                    <form
                      action="https://elemisfreebies.us20.list-manage.com/subscribe/post?u=aa4947f70a475ce162057838d&amp;id=b49ef47a9a"
                      method="post"
                      id="mc-embedded-subscribe-form2"
                      name="mc-embedded-subscribe-form"
                      className="validate dark-fields"
                      target="_blank">
                      <div id="mc_embed_signup_scroll2">
                        <div className="mc-field-group input-group form-floating">
                          <input
                            type="email"
                            name="EMAIL"
                            id="mce-EMAIL2"
                            placeholder="Email Address"
                            className="required email form-control"
                          />
                          <label
                            htmlFor="mce-EMAIL2"
                            className="position-absolute">
                            Email Address
                          </label>
                          <input
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
                          style={{position: 'absolute', left: -5000}}
                          aria-hidden="true">
                          <input
                            type="text"
                            name="b_ddc180777a163e0f9f66ee014_4b1bcfa0bc"
                            tabIndex={-1}
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

        <div className="row gy-6 gy-lg-0">
          <div className="col-lg-4">
            <div className="widget">
              <h3 className="h2 mb-3">{title}</h3>
              <p className="lead mb-5">{description}</p>
              <NextLink
                title={linkTitle}
                href={linkHref}
                className="btn btn-primary rounded-pill"
              />
            </div>
          </div>

          <div className="col-md-4 col-lg-2 offset-lg-2">
            {widget(helps || [], listTitle1 || 'Need Help?')}
          </div>

          <div className="col-md-4 col-lg-2">
            {widget(learnMore || [], listTitle2 || 'Learn More')}
          </div>

          <div className="col-md-4 col-lg-2">
            <div className="widget">
              <h4 className="widget-title mb-3">{addressTitle}</h4>
              <address>{addressLine}</address>
              <a href={`mailto:${email}`} className="link-body">
                {email}
              </a>
              <br /> {phone}
            </div>
          </div>
        </div>

        <hr className="mt-13 mt-md-15 mb-7" />

        <div className="d-md-flex align-items-center justify-content-between">
          <p className="mb-2 mb-lg-0">{copyright}</p>
          <SocialLinks links={socialLinks} className="nav social text-md-end" />
        </div>
      </div>
    </footer>
  );
}
