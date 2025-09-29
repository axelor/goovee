import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer12Schema = {
  title: 'Footer 12',
  code: 'footer12',
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
      target: 'Footer12Links',
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
      name: 'Footer12Links',
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

export type Footer12Data = Data<typeof footer12Schema>;

export const footer12Demos: Demo<typeof footer12Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-20',
    sequence: 8,
    data: {
      footer12Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer12Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer12AddressTitle: 'Get in Touch',
      footer12AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer12Email: 'info@email.com',
      footer12Phone: '00 (123) 456 78 90',
      footer12ListTitle: 'Learn More',
      footer12NewsletterTitle: 'Our Newsletter',
      footer12NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer12Links: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer12SocialLinks: [
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
    page: 'demo-20',
    sequence: 8,
    data: {
      footer12Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-light.png',
        fileType: 'image/png',
        filePath: '/img/logo-light.png',
      },
      footer12Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer12AddressTitle: 'Contactez-nous',
      footer12AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer12Email: 'info@email.com',
      footer12Phone: '00 (123) 456 78 90',
      footer12ListTitle: 'En savoir plus',
      footer12NewsletterTitle: 'Notre bulletin',
      footer12NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer12Links: [
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
      footer12SocialLinks: [
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
