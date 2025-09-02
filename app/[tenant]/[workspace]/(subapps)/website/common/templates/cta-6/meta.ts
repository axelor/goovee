import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta6Schema = {
  title: 'CTA 6',
  code: 'cta6',
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

export type Cta6Data = Data<typeof cta6Schema>;

export const cta6Demos: Demo<typeof cta6Schema>[] = [
  {
    language: 'en_US',
    data: {
      cta6Title: 'Trust us, join 10K+ clients to grow your business.',
      cta6LinkTitle: 'Get Started',
      cta6LinkHref: '#',
      cta6Image: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      cta6Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta6LinkTitle: 'Commencer',
      cta6LinkHref: '#',
      cta6Image: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
    },
  },
];
