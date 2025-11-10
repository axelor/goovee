import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const cta9Code = 'cta9';

export const cta9Schema = {
  title: 'CTA 9',
  code: cta9Code,
  type: Template.block,
  fields: [
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
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-17 text-center',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Cta9Data = Data<typeof cta9Schema>;

export const cta9Demos: Demo<typeof cta9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-23',
    sequence: 6,
    data: {
      cta9Title:
        "I'm here to document your special moments. Searching for a professional photographer?",
      cta9LinkTitle: 'Contact Me',
      cta9LinkHref: '#',
      cta9Image: {
        attrs: {
          alt: 'Professional photographer',
          width: 2000,
          height: 1333,
          image: {
            fileName: 'bg33.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg33.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-23',
    sequence: 6,
    data: {
      cta9Title:
        'Je suis là pour documenter vos moments privilégiés. Vous recherchez un photographe professionnel ?',
      cta9LinkTitle: 'Contactez-moi',
      cta9LinkHref: '#',
      cta9Image: {
        attrs: {
          alt: 'Photographe professionnel',
          width: 2000,
          height: 1333,
          image: {
            fileName: 'bg33.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg33.jpg',
          },
        },
      },
    },
  },
];
