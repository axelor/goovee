import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const banner2Schema = {
  title: 'Banner 2',
  code: 'banner2',
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
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

export type Banner2Data = Data<typeof banner2Schema>;

export const banner2Demos: Demo<typeof banner2Schema>[] = [
  {
    language: 'en_US',
    data: {
      banner2Heading: 'I shoot with imagination, philosophy, and emotion.',
      banner2Image: {
        id: '1',
        version: 1,
        fileName: 'bg34.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg34.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      banner2Heading:
        'Je photographie avec imagination, philosophie et émotion.',
      banner2Image: {
        id: '1',
        version: 1,
        fileName: 'bg34.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg34.jpg',
      },
    },
  },
];
