import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const banner3Schema = {
  title: 'Banner 3',
  code: 'banner3',
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
    {
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-18 text-center',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Banner3Data = Data<typeof banner3Schema>;

export const banner3Demos: Demo<typeof banner3Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-4',
    sequence: 5,
    data: {
      banner3Heading:
        'Discover all the essential information you need to create a business process model.',
      banner3Image: {
        id: '1',
        version: 1,
        fileName: 'bg1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg1.jpg',
      },
      banner3Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-4',
    sequence: 5,
    data: {
      banner3Heading:
        'Découvrez toutes les informations essentielles dont vous avez besoin pour créer un modèle de processus métier.',
      banner3Image: {
        id: '1',
        version: 1,
        fileName: 'bg1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg1.jpg',
      },
      banner3Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
    },
  },
];
