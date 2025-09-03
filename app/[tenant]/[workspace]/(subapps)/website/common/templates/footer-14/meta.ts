import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer14Schema = {
  title: 'Footer 14',
  code: 'footer14',
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
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'title',
      title: 'Title',
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
      target: 'Footer14Links',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer14Links',
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
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer14Data = Data<typeof footer14Schema>;

export const footer14Demos: Demo<typeof footer14Schema>[] = [
  {
    language: 'en_US',
    data: {
      footer14Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer14BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg27.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg27.jpg',
      },
      footer14Title:
        'Over 5K+ customers have put faith in us. Join them by utilize our offer to help your company develop.',
      footer14LinkTitle: 'Join Us',
      footer14LinkHref: '#',
      footer14Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer14AddressTitle: 'Get in Touch',
      footer14AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer14Email: 'info@email.com',
      footer14Phone: '00 (123) 456 78 90',
      footer14ListTitle: 'Learn More',
      footer14NewsletterTitle: 'Our Newsletter',
      footer14NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer14Links: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer14SocialLinks: [
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
      footer14Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer14BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg27.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg27.jpg',
      },
      footer14Title:
        'Plus de 5 000 clients nous ont fait confiance. Rejoignez-les en utilisant notre offre pour aider votre entreprise à se développer.',
      footer14LinkTitle: 'Rejoignez-nous',
      footer14LinkHref: '#',
      footer14Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer14AddressTitle: 'Contactez-nous',
      footer14AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer14Email: 'info@email.com',
      footer14Phone: '00 (123) 456 78 90',
      footer14ListTitle: 'En savoir plus',
      footer14NewsletterTitle: 'Notre bulletin',
      footer14NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer14Links: [
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
      footer14SocialLinks: [
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
