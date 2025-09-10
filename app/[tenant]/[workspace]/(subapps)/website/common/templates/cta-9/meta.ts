import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta9Schema = {
  title: 'CTA 9',
  code: 'cta9',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Cta9Data = Data<typeof cta9Schema>;

export const cta9Demos: Demo<typeof cta9Schema>[] = [
  {
    language: 'en_US',
    data: {
      cta9Title:
        "I'm here to document your special moments. Searching for a professional photographer?",
      cta9LinkTitle: 'Contact Me',
      cta9LinkHref: '#',
      cta9Image: {
        id: '1',
        version: 1,
        fileName: 'bg33.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg33.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      cta9Title:
        'Je suis là pour documenter vos moments privilégiés. Vous recherchez un photographe professionnel ?',
      cta9LinkTitle: 'Contactez-moi',
      cta9LinkHref: '#',
      cta9Image: {
        id: '1',
        version: 1,
        fileName: 'bg33.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg33.jpg',
      },
    },
  },
];
