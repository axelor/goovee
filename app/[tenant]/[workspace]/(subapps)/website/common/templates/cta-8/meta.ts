import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta8Schema = {
  title: 'CTA 8',
  code: 'cta8',
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

export type Cta8Data = Data<typeof cta8Schema>;

export const cta8Demos: Demo<typeof cta8Schema>[] = [
  {
    language: 'en_US',
    data: {
      cta8Title: 'Trust us, join 10K+ clients to grow your business.',
      cta8Caption: 'Join Our Community',
      cta8LinkTitle: 'Get Started',
      cta8LinkHref: '#',
      cta8Image: {
        id: '1',
        version: 1,
        fileName: 'bg16.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg16.png',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      cta8Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta8Caption: 'Rejoignez notre communauté',
      cta8LinkTitle: 'Commencer',
      cta8LinkHref: '#',
      cta8Image: {
        id: '1',
        version: 1,
        fileName: 'bg16.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg16.png',
      },
    },
  },
];
