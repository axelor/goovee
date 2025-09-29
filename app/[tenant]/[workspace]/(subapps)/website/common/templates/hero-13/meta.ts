import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero13Schema = {
  title: 'Hero 13',
  code: 'hero13',
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
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-image bg-overlay bg-overlay-300 text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-17 pb-19 pt-md-19 pb-md-20 text-center',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero13Data = Data<typeof hero13Schema>;

export const hero13Demos: Demo<typeof hero13Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-13',
    sequence: 1,
    data: {
      hero13Title: 'We bring rapid solutions for your business',
      hero13Caption: 'HELLO 👋',
      hero13Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero13BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-13',
    sequence: 1,
    data: {
      hero13Title: 'Nous apportons des solutions rapides pour votre entreprise',
      hero13Caption: 'HELLO 👋',
      hero13Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero13BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
    },
  },
];
