import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const footer9Code = 'footer9';

export const footer9Schema = {
  title: 'Footer 9',
  code: footer9Code,
  type: Template.block,
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'copyright',
      title: 'Copyright',
      type: 'string',
    },
    {
      name: 'addressTitle',
      title: 'Address Title',
      type: 'string',
    },
    {
      name: 'addressLine',
      title: 'Address Line',
      type: 'string',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
    },
    {
      name: 'helpTitle',
      title: 'Help Title',
      type: 'string',
    },
    {
      name: 'footerNavTitle',
      title: 'Footer Nav Title',
      type: 'string',
    },
    {
      name: 'helps',
      title: 'Helps',
      type: 'json-one-to-many',
      target: 'Footer9Helps',
    },
    {
      name: 'footerNav',
      title: 'Footer Nav',
      type: 'json-one-to-many',
      target: 'Footer9FooterNav',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
    },
    {
      name: 'footerClassName',
      title: 'Footer Class Name',
      type: 'string',
      defaultValue: 'footer bg-dark text-inverse',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-13 py-md-15',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer9Helps',
      title: 'Helps',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
        },
      ],
    },
    {
      name: 'Footer9FooterNav',
      title: 'Footer Nav',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Footer9Data = Data<typeof footer9Schema>;

export const footer9Demos: Demo<typeof footer9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-23',
    sequence: 9,
    data: {
      footer9Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer9Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer9AddressTitle: 'Get in Touch',
      footer9AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer9Email: 'info@email.com',
      footer9Phone: '00 (123) 456 78 90',
      footer9HelpTitle: 'Need Help?',
      footer9FooterNavTitle: 'Learn More',
      footer9Helps: [
        {attrs: {title: 'Support', url: '#'}},
        {attrs: {title: 'Get Started', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9FooterNav: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-23',
    sequence: 9,
    data: {
      footer9Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer9Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer9AddressTitle: 'Contactez-nous',
      footer9AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer9Email: 'info@email.com',
      footer9Phone: '00 (123) 456 78 90',
      footer9HelpTitle: 'Besoin d’aide ?',
      footer9FooterNavTitle: 'En savoir plus',
      footer9Helps: [
        {attrs: {title: 'Support', url: '#'}},
        {attrs: {title: 'Commencer', url: '#'}},
        {
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9FooterNav: [
        {attrs: {title: 'À propos de nous', url: '#'}},
        {attrs: {title: 'Notre histoire', url: '#'}},
        {attrs: {title: 'Projets', url: '#'}},
        {
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-15',
    sequence: 9,
    data: {
      footer9Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer9Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer9AddressTitle: 'Get in Touch',
      footer9AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer9Email: 'info@email.com',
      footer9Phone: '00 (123) 456 78 90',
      footer9HelpTitle: 'Need Help?',
      footer9FooterNavTitle: 'Learn More',
      footer9Helps: [
        {attrs: {title: 'Support', url: '#'}},
        {attrs: {title: 'Get Started', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9FooterNav: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-15',
    sequence: 9,
    data: {
      footer9Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer9Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer9AddressTitle: 'Contactez-nous',
      footer9AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer9Email: 'info@email.com',
      footer9Phone: '00 (123) 456 78 90',
      footer9HelpTitle: 'Besoin d’aide ?',
      footer9FooterNavTitle: 'En savoir plus',
      footer9Helps: [
        {attrs: {title: 'Support', url: '#'}},
        {attrs: {title: 'Commencer', url: '#'}},
        {
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9FooterNav: [
        {attrs: {title: 'À propos de nous', url: '#'}},
        {attrs: {title: 'Notre histoire', url: '#'}},
        {attrs: {title: 'Projets', url: '#'}},
        {
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
];
