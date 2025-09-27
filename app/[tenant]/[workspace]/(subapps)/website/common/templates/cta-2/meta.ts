import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta2Schema = {
  title: 'CTA 2',
  code: 'cta2',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'linkTitle1',
      title: 'Link Title 1',
      type: 'string',
    },
    {
      name: 'linkTitle2',
      title: 'Link Title 2',
      type: 'string',
    },
    {
      name: 'linkHref1',
      title: 'Link Href 1',
      type: 'string',
    },
    {
      name: 'linkHref2',
      title: 'Link Href 2',
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

export type Cta2Data = Data<typeof cta2Schema>;

export const cta2Demos: Demo<typeof cta2Schema>[] = [
  {
    language: 'en_US',
    data: {
      cta2Title: 'Trust us, join 10K+ clients to grow your business.',
      cta2LinkTitle1: 'Get Started',
      cta2LinkTitle2: 'Free Trial',
      cta2LinkHref1: '#',
      cta2LinkHref2: '#',
      cta2Image: {
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
      cta2Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta2LinkTitle1: 'Commencer',
      cta2LinkTitle2: 'Essai gratuit',
      cta2LinkHref1: '#',
      cta2LinkHref2: '#',
      cta2Image: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
    },
  },
];
