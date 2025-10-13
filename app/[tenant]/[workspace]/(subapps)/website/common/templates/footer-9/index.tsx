import type {TemplateProps} from '@/subapps/website/common/types';
import {type Footer9Data} from './meta';
import {getImage} from '@/subapps/website/common/utils/helper';
import SocialLinks from '@/subapps/website/common/components/reuseable/SocialLinks';
import NextLink from '@/subapps/website/common/components/reuseable/links/NextLink';
import Image from 'next/image';

export default function Footer9(props: TemplateProps<Footer9Data>) {
  const {data} = props;
  const {
    footer9Logo,
    footer9Copyright: copyright,
    footer9AddressTitle: addressTitle,
    footer9AddressLine: addressLine,
    footer9Email: email,
    footer9Phone: phone,
    footer9HelpTitle: helpTitle,
    footer9FooterNavTitle: footerNavTitle,
    footer9Helps: helps,
    footer9FooterNav: footerNav,
    footer9SocialLinks,
    footer9FooterClassName: footerClassName,
    footer9ContainerClassName: containerClassName,
  } = data || {};

  const logo = getImage({
    image: footer9Logo,
    path: 'footer9Logo',
    ...props,
  });

  const socialLinks =
    footer9SocialLinks?.map(socialLink => ({
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

          <div className="col-md-4 col-lg-2 offset-lg-2">
            {widget(helps || [], helpTitle || 'Need Help?')}
          </div>

          <div className="col-md-4 col-lg-2">
            {widget(footerNav || [], footerNavTitle || 'Learn More')}
          </div>

          <div className="col-md-4 col-lg-2">
            <div className="widget">
              <h4 className="widget-title text-white mb-3">{addressTitle}</h4>
              <address>{addressLine}</address>
              <NextLink title={email} href={`mailto:${email}`} />
              <br /> {phone}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
