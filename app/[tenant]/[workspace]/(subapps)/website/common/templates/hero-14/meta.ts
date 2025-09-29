import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero14Schema = {
  title: 'Hero 14',
  code: 'hero14',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
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
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-10 pt-md-14 pb-14 pb-md-0',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero14Data = Data<typeof hero14Schema>;

export const hero14Demos: Demo<typeof hero14Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-14',
    sequence: 1,
    data: {
      hero14Title: 'We provide rapid solutions for your company.',
      hero14Description:
        'We work as an outstanding identity-designing company that feels the strength of innovative thinking.',
      hero14LinkTitle: 'Learn More',
      hero14LinkHref: '#',
      hero14Image: {
        id: '1',
        version: 1,
        fileName: 'about18.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about18.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-14',
    sequence: 1,
    data: {
      hero14Title:
        'Nous apportons des solutions rapides pour votre entreprise.',
      hero14Description:
        'Nous travaillons comme une entreprise de conception d’identité exceptionnelle qui ressent la force de la pensée innovante.',
      hero14LinkTitle: 'En savoir plus',
      hero14LinkHref: '#',
      hero14Image: {
        id: '1',
        version: 1,
        fileName: 'about18.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about18.jpg',
      },
    },
  },
];
