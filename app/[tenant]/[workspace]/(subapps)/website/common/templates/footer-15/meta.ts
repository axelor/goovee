import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer15Schema = {
  title: 'Footer 15',
  code: 'footer15',
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
      name: 'title',
      title: 'Title',
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
      name: 'phoneTitle',
      title: 'Phone Title',
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
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
    },
    {
      name: 'footerClassName',
      title: 'Footer Class Name',
      type: 'string',
      defaultValue: 'footer bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-13 pb-7',
    },
  ],
  models: [socialLinksModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer15Data = Data<typeof footer15Schema>;

export const footer15Demos: Demo<typeof footer15Schema>[] = [
  {
    language: 'en_US',
    data: {
      footer15Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-dark.png',
        fileType: 'image/png',
        filePath: '/img/logo-dark.png',
      },
      footer15Title:
        "I'm Caitlyn Lighthouse, a photographer specializing in food, drink and product photography.",
      footer15Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer15AddressTitle: 'Address',
      footer15AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer15PhoneTitle: 'Phone',
      footer15Phone1: '00 (123) 456 78 90',
      footer15Phone2: '00 (987) 654 32 10',
      footer15SocialLinks: [
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
      footer15Logo: {
        id: '1',
        version: 1,
        fileName: 'logo-dark.png',
        fileType: 'image/png',
        filePath: '/img/logo-dark.png',
      },
      footer15Title:
        'Je suis Caitlyn Lighthouse, une photographe spécialisée dans la photographie de nourriture, de boissons et de produits.',
      footer15Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer15AddressTitle: 'Adresse',
      footer15AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer15PhoneTitle: 'Téléphone',
      footer15Phone1: '00 (123) 456 78 90',
      footer15Phone2: '00 (987) 654 32 10',
      footer15SocialLinks: [
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
