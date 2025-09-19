import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const contact9Schema = {
  title: 'Contact 9',
  code: 'contact9',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact9Data = Data<typeof contact9Schema>;

export const contact9Demos: Demo<typeof contact9Schema>[] = [
  {
    language: 'en_US',
    data: {
      contact9Title: 'Trust us, join 10K+ clients to grow your business.',
      contact9Caption: 'Join Our Community',
      contact9LinkTitle: 'Join Us',
      contact9LinkHref: '#',
      contact9Image: {
        id: '1',
        version: 1,
        fileName: 'bg10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg10.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      contact9Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      contact9Caption: 'Rejoignez notre communauté',
      contact9LinkTitle: 'Rejoignez-nous',
      contact9LinkHref: '#',
      contact9Image: {
        id: '1',
        version: 1,
        fileName: 'bg10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg10.jpg',
      },
    },
  },
];
