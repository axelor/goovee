import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {socialLinksModel} from '../json-models';

export const footer10Code = 'footer10';

export const footer10Schema = {
  title: 'Footer 10',
  code: footer10Code,
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
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
      name: 'helps',
      title: 'Helps',
      type: 'json-one-to-many',
      target: 'Footer10Helps',
    },
    {
      name: 'learnMore',
      title: 'Learn More',
      type: 'json-one-to-many',
      target: 'Footer10LearnMore',
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
      defaultValue: 'container pt-20 pt-lg-21 pb-7',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer10Helps',
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
      name: 'Footer10LearnMore',
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

export type Footer10Data = Data<typeof footer10Schema>;

export const footer10Demos: Demo<typeof footer10Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 9,
    data: {
      footer10Heading: 'Join the Community',
      footer10Description:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      footer10LinkTitle: 'Join Us',
      footer10LinkHref: '#',
      footer10Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer10AddressTitle: 'Get in Touch',
      footer10AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer10Email: 'info@email.com',
      footer10Phone: '00 (123) 456 78 90',
      footer10ListTitle1: 'Need Help?',
      footer10ListTitle2: 'Learn More',
      footer10Helps: [
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Get Started', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer10LearnMore: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Pricing', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Features', url: '#'}},
      ],
      footer10SocialLinks: [
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
    site: 'fr',
    page: 'demo-17',
    sequence: 9,
    data: {
      footer10Heading: 'Rejoignez la communauté',
      footer10Description:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      footer10LinkTitle: 'Rejoignez-nous',
      footer10LinkHref: '#',
      footer10Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer10AddressTitle: 'Contactez-nous',
      footer10AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer10Email: 'info@email.com',
      footer10Phone: '00 (123) 456 78 90',
      footer10ListTitle1: 'Besoin d’aide ?',
      footer10ListTitle2: 'En savoir plus',
      footer10Helps: [
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
      footer10LearnMore: [
        {id: '1', version: 0, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projets', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Tarifs', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Caractéristiques', url: '#'}},
      ],
      footer10SocialLinks: [
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
