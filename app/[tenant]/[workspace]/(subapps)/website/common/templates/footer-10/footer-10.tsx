import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer10Data} from './meta';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';

export function Footer10(props: TemplateProps<Footer10Data>) {
  const {data} = props;
  const {
    footer10Heading: heading,
    footer10Description: description,
    footer10LinkTitle: linkTitle,
    footer10LinkHref: linkHref,
    footer10Copyright: copyright,
    footer10AddressTitle: addressTitle,
    footer10AddressLine: addressLine,
    footer10Email: email,
    footer10Phone: phone,
    footer10ListTitle1: listTitle1,
    footer10ListTitle2: listTitle2,
    footer10Helps: helps,
    footer10LearnMore: learnMore,
    footer10SocialLinks,
    footer10FooterClassName: footerClassName,
    footer10ContainerClassName: containerClassName,
  } = data || {};

  const socialLinks =
    footer10SocialLinks?.map(socialLink => ({
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
        <div className="row gy-6 gy-lg-0">
          <div className="col-lg-4">
            <div className="widget">
              <h3 className="h2 mb-3 text-white">{heading}</h3>
              <p className="lead mb-5">{description}</p>
              <NextLink
                title={linkTitle}
                href={linkHref}
                className="btn btn-white rounded-pill"
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
              <h4 className="widget-title text-white mb-3">{addressTitle}</h4>
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
          <SocialLinks
            links={socialLinks}
            className="nav social social-white text-md-end"
          />
        </div>
      </div>
    </footer>
  );
}
