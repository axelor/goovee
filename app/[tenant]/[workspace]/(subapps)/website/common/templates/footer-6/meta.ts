import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer6Schema = {
  title: 'Footer 6',
  code: 'footer6',
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
      target: 'Footer6Links',
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
      defaultValue: 'footer bg-dark text-inverse mt-5 mt-md-16',
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
      name: 'Footer6Links',
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

export type Footer6Data = Data<typeof footer6Schema>;

export const footer6Demos: Demo<typeof footer6Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-5',
    sequence: 8,
    data: {
      footer6Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer6Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer6AddressTitle: 'Get in Touch',
      footer6AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer6Email: 'info@email.com',
      footer6Phone: '00 (123) 456 78 90',
      footer6LinkTitle: 'Learn More',
      footer6NewsletterTitle: 'Our Newsletter',
      footer6NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer6Links: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer6SocialLinks: [
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
    page: 'demo-5',
    sequence: 8,
    data: {
      footer6Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer6Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer6AddressTitle: 'Contactez-nous',
      footer6AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer6Email: 'info@email.com',
      footer6Phone: '00 (123) 456 78 90',
      footer6LinkTitle: 'En savoir plus',
      footer6NewsletterTitle: 'Notre bulletin',
      footer6NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer6Links: [
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
      footer6SocialLinks: [
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
