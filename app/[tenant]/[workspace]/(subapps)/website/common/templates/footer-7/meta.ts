import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {socialLinksModel} from '../json-models';

export const footer7Schema = {
  title: 'Footer 7',
  code: 'footer7',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
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
      name: 'copyright',
      title: 'Copyright',
      type: 'string',
    },
    {
      name: 'listTitle1',
      title: 'List Title 1',
      type: 'string',
    },
    {
      name: 'listTitle2',
      title: 'List Title 2',
      type: 'string',
    },
    {
      name: 'helps',
      title: 'Helps',
      type: 'json-one-to-many',
      target: 'Footer7Helps',
    },
    {
      name: 'learnMore',
      title: 'Learn More',
      type: 'json-one-to-many',
      target: 'Footer7LearnMore',
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
      defaultValue: 'container pt-14 pt-md-17 pb-7',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer7Helps',
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
      name: 'Footer7LearnMore',
      title: 'Learn More',
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

export type Footer7Data = Data<typeof footer7Schema>;

export const footer7Demos: Demo<typeof footer7Schema>[] = [
  {
    language: 'en_US',
    data: {
      footer7Title: 'Join the Community',
      footer7Description:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      footer7LinkTitle: 'Join Us',
      footer7LinkHref: '#',
      footer7AddressTitle: 'Get in Touch',
      footer7AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer7Email: 'info@email.com',
      footer7Phone: '00 (123) 456 78 90',
      footer7Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer7ListTitle1: 'Need Help?',
      footer7ListTitle2: 'Learn More',
      footer7Helps: [
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Get Started', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer7LearnMore: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Pricing', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Features', url: '#'}},
      ],
      footer7SocialLinks: [
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
    data: {
      footer7Title: 'Rejoignez la communauté',
      footer7Description:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      footer7LinkTitle: 'Rejoignez-nous',
      footer7LinkHref: '#',
      footer7AddressTitle: 'Contactez-nous',
      footer7AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer7Email: 'info@email.com',
      footer7Phone: '00 (123) 456 78 90',
      footer7Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer7ListTitle1: 'Besoin d’aide ?',
      footer7ListTitle2: 'En savoir plus',
      footer7Helps: [
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
      footer7LearnMore: [
        {id: '1', version: 0, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projets', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Tarifs', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Caractéristiques', url: '#'}},
      ],
      footer7SocialLinks: [
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
