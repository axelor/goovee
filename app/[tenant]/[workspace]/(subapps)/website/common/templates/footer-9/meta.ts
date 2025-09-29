import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer9Schema = {
  title: 'Footer 9',
  code: 'footer9',
  type: Template.block,
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer9Data = Data<typeof footer9Schema>;

export const footer9Demos: Demo<typeof footer9Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-23',
    sequence: 9,
    data: {
      footer9Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
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
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Get Started', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9FooterNav: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
    page: 'demo-23',
    sequence: 9,
    data: {
      footer9Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
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
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Commencer', url: '#'}},
        {
          id: '3',
          version: 0,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '4',
          version: 0,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9FooterNav: [
        {id: '1', version: 0, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projets', url: '#'}},
        {
          id: '4',
          version: 0,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '5',
          version: 0,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
    page: 'demo-15',
    sequence: 9,
    data: {
      footer9Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
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
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Get Started', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9FooterNav: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer9SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
    page: 'demo-15',
    sequence: 9,
    data: {
      footer9Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
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
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Commencer', url: '#'}},
        {
          id: '3',
          version: 0,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '4',
          version: 0,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9FooterNav: [
        {id: '1', version: 0, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projets', url: '#'}},
        {
          id: '4',
          version: 0,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '5',
          version: 0,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer9SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
