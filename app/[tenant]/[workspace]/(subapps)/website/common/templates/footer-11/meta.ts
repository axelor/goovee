import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {socialLinksModel} from '../json-models';

export const footer11Code = 'footer11';

export const footer11Schema = {
  title: 'Footer 11',
  code: footer11Code,
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
      name: 'listTitle',
      title: 'List Title',
      type: 'string',
    },
    {
      name: 'newsletterTitle',
      title: 'Newsletter Title',
      type: 'string',
    },
    {
      name: 'newsletterDescription',
      title: 'Newsletter Description',
      type: 'string',
    },
    {
      name: 'links',
      title: 'Links',
      type: 'json-one-to-many',
      target: 'Footer11Links',
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
      defaultValue: 'footer bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-13 pb-md-15',
    },
  ],
  models: [
    socialLinksModel,
    imageModel,
    {
      name: 'Footer11Links',
      title: 'Links',
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
  ],
} as const satisfies TemplateSchema;

export type Footer11Data = Data<typeof footer11Schema>;

export const footer11Demos: Demo<typeof footer11Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-19',
    sequence: 9,
    data: {
      footer11Logo: {
        attrs: {
          alt: 'Company logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer11Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer11AddressTitle: 'Get in Touch',
      footer11AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer11Email: 'info@email.com',
      footer11Phone: '00 (123) 456 78 90',
      footer11ListTitle: 'Learn More',
      footer11NewsletterTitle: 'Our Newsletter',
      footer11NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer11Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer11SocialLinks: [
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
    page: 'demo-19',
    sequence: 9,
    data: {
      footer11Logo: {
        attrs: {
          alt: "Logo de l'entreprise",
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer11Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer11AddressTitle: 'Contactez-nous',
      footer11AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer11Email: 'info@email.com',
      footer11Phone: '00 (123) 456 78 90',
      footer11ListTitle: 'En savoir plus',
      footer11NewsletterTitle: 'Notre bulletin',
      footer11NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer11Links: [
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
      footer11SocialLinks: [
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
    page: 'demo-18',
    sequence: 11,
    data: {
      footer11Logo: {
        attrs: {
          alt: 'Company logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer11Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer11AddressTitle: 'Get in Touch',
      footer11AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer11Email: 'info@email.com',
      footer11Phone: '00 (123) 456 78 90',
      footer11ListTitle: 'Learn More',
      footer11NewsletterTitle: 'Our Newsletter',
      footer11NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer11Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer11SocialLinks: [
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
    page: 'demo-18',
    sequence: 11,
    data: {
      footer11Logo: {
        attrs: {
          alt: "Logo de l'entreprise",
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer11Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer11AddressTitle: 'Contactez-nous',
      footer11AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer11Email: 'info@email.com',
      footer11Phone: '00 (123) 456 78 90',
      footer11ListTitle: 'En savoir plus',
      footer11NewsletterTitle: 'Notre bulletin',
      footer11NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer11Links: [
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
      footer11SocialLinks: [
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
