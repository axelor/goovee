import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const footer4Code = 'footer4';

export const footer4Schema = {
  title: 'Footer 4',
  code: footer4Code,
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
      name: 'linkTitle',
      title: 'Link Title',
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
      target: 'Footer4Links',
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
      defaultValue: 'container py-13 py-md-15',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer4Links',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Footer4Data = Data<typeof footer4Schema>;

export const footer4Demos: Demo<typeof footer4Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-12',
    sequence: 9,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer4AddressTitle: 'Get in Touch',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'Learn More',
      footer4NewsletterTitle: 'Our Newsletter',
      footer4NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer4Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer4SocialLinks: [
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
    page: 'demo-12',
    sequence: 9,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer4AddressTitle: 'Contactez-nous',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'En savoir plus',
      footer4NewsletterTitle: 'Notre bulletin',
      footer4NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer4Links: [
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
      footer4SocialLinks: [
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
    page: 'demo-6',
    sequence: 7,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer4AddressTitle: 'Get in Touch',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'Learn More',
      footer4NewsletterTitle: 'Our Newsletter',
      footer4NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer4Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer4SocialLinks: [
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
    page: 'demo-6',
    sequence: 7,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer4AddressTitle: 'Contactez-nous',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'En savoir plus',
      footer4NewsletterTitle: 'Notre bulletin',
      footer4NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer4Links: [
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
      footer4SocialLinks: [
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
    page: 'demo-2',
    sequence: 9,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer4AddressTitle: 'Get in Touch',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'Learn More',
      footer4NewsletterTitle: 'Our Newsletter',
      footer4NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer4Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer4SocialLinks: [
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
    page: 'demo-2',
    sequence: 9,
    data: {
      footer4Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-dark.png',
            fileType: 'image/png',
            filePath: '/img/logo-dark.png',
          },
        },
      },
      footer4Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer4AddressTitle: 'Contactez-nous',
      footer4AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer4Email: 'info@email.com',
      footer4Phone: '00 (123) 456 78 90',
      footer4LinkTitle: 'En savoir plus',
      footer4NewsletterTitle: 'Notre bulletin',
      footer4NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer4Links: [
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
      footer4SocialLinks: [
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
