import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const banner6Schema = {
  title: 'Banner 6',
  code: 'banner6',
  type: Template.block,
  fields: [
    {
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
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

export type Banner6Data = Data<typeof banner6Schema>;

export const banner6Demos: Demo<typeof banner6Schema>[] = [
  {
    language: 'en_US',
    data: {
      banner6Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      banner6Image: {
        id: '1',
        version: 1,
        fileName: 'bg1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg1.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      banner6Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      banner6Image: {
        id: '1',
        version: 1,
        fileName: 'bg1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg1.jpg',
      },
    },
  },
];
