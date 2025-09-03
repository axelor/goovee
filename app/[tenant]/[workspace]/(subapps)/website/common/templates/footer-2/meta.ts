import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer2Schema = {
  title: 'Footer 2',
  code: 'footer2',
  type: Template.block,
  fields: [
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
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'para1',
      title: 'Para 1',
      type: 'string',
    },
    {
      name: 'para2',
      title: 'Para 2',
      type: 'string',
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'addressLine',
      title: 'Address Line',
      type: 'string',
    },
    {
      name: 'email1',
      title: 'Email 1',
      type: 'string',
    },
    {
      name: 'email2',
      title: 'Email 2',
      type: 'string',
    },
    {
      name: 'phone1',
      title: 'Phone 1',
      type: 'string',
    },
    {
      name: 'phone2',
      title: 'Phone 2',
      type: 'string',
    },
    {
      name: 'linkHref1',
      title: 'Link Href 1',
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
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
    },
  ],
  models: [socialLinksModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer2Data = Data<typeof footer2Schema>;

export const footer2Demos: Demo<typeof footer2Schema>[] = [
  {
    language: 'en_US',
    data: {
      footer2Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer2AddressTitle: 'Address',
      footer2BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      footer2Caption: 'Join Our Community',
      footer2Para1:
        'We are a company that focuses on establishing long-term relationships with our customers.',
      footer2Para2:
        'We are a company that focuses on establishing long-term relationships with our customers.',
      footer2LinkTitle: 'About Us',
      footer2AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer2Email1: 'info@email.com',
      footer2Email2: 'help@email.com',
      footer2Phone1: '00 (123) 456 78 90',
      footer2Phone2: '00 (987) 654 32 10',
      footer2LinkHref1: '#',
      footer2NewsletterTitle: 'Subscribe to our newsletter',
      footer2NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer2SocialLinks: [
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
      footer2Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer2AddressTitle: 'Adresse',
      footer2BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      footer2Caption: 'Rejoignez notre communauté',
      footer2Para1:
        'Nous sommes une entreprise qui se concentre sur l’établissement de relations à long terme avec nos clients.',
      footer2Para2:
        'Nous sommes une entreprise qui se concentre sur l’établissement de relations à long terme avec nos clients.',
      footer2LinkTitle: 'À propos de nous',
      footer2AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer2Email1: 'info@email.com',
      footer2Email2: 'help@email.com',
      footer2Phone1: '00 (123) 456 78 90',
      footer2Phone2: '00 (987) 654 32 10',
      footer2LinkHref1: '#',
      footer2NewsletterTitle: 'Abonnez-vous à notre newsletter',
      footer2NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer2SocialLinks: [
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
