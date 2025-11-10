import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const footer6Code = 'footer6';

export const footer6Schema = {
  title: 'Footer 6',
  code: footer6Code,
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Footer6Data = Data<typeof footer6Schema>;

export const footer6Demos: Demo<typeof footer6Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-5',
    sequence: 8,
    data: {
      footer6Logo: {
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
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer6SocialLinks: [
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
    page: 'demo-5',
    sequence: 8,
    data: {
      footer6Logo: {
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
      footer6SocialLinks: [
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
