import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta7Schema = {
  title: 'CTA 7',
  code: 'cta7',
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
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerCardClassName',
      title: 'Container Card Class Name',
      type: 'string',
      defaultValue: 'container-card',
    },
    {
      name: 'cardClassName',
      title: 'Card Class Name',
      type: 'string',
      defaultValue:
        'card image-wrapper bg-full bg-image bg-overlay bg-overlay-light-500 mb-14',
    },
    {
      name: 'cardBodyClassName',
      title: 'Card Body Class Name',
      type: 'string',
      defaultValue: 'card-body py-14 px-0',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Cta7Data = Data<typeof cta7Schema>;

export const cta7Demos: Demo<typeof cta7Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-18',
    sequence: 10,
    data: {
      cta7Title: 'Trust us, join 10K+ clients to grow your business.',
      cta7Caption: 'Join Our Community',
      cta7LinkTitle: 'Get Started',
      cta7LinkHref: '#',
      cta7Image: {
        id: '1',
        version: 1,
        fileName: 'bg22.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg22.png',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-18',
    sequence: 10,
    data: {
      cta7Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta7Caption: 'Rejoignez notre communauté',
      cta7LinkTitle: 'Commencer',
      cta7LinkHref: '#',
      cta7Image: {
        id: '1',
        version: 1,
        fileName: 'bg22.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg22.png',
      },
    },
  },
];
