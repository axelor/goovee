import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const contact9Code = 'contact9';

export const contact9Schema = {
  title: 'Contact 9',
  code: contact9Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
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
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-18',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Contact9Data = Data<typeof contact9Schema>;

export const contact9Demos: Demo<typeof contact9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-14',
    sequence: 3,
    data: {
      contact9Title: 'Trust us, join 10K+ clients to grow your business.',
      contact9Caption: 'Join Our Community',
      contact9LinkTitle: 'Join Us',
      contact9LinkHref: '#',
      contact9Image: {
        attrs: {
          alt: 'Join our community',
          width: 1440,
          height: 541,
          image: {
            fileName: 'bg10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg10.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-14',
    sequence: 3,
    data: {
      contact9Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      contact9Caption: 'Rejoignez notre communauté',
      contact9LinkTitle: 'Rejoignez-nous',
      contact9LinkHref: '#',
      contact9Image: {
        attrs: {
          alt: 'Rejoignez notre communauté',
          width: 1440,
          height: 541,
          image: {
            fileName: 'bg10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg10.jpg',
          },
        },
      },
    },
  },
];
