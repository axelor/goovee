import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
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
      type: 'json-many-to-one',
      target: 'Image',
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
  models: [imageModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Banner6Data = Data<typeof banner6Schema>;

export const banner6Demos: Demo<typeof banner6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 2,
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
        version: 0,
        attrs: {
          alt: 'Video background',
          width: 1440,
          height: 523,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg1.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 2,
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
        version: 0,
        attrs: {
          alt: 'Arrière-plan vidéo',
          width: 1440,
          height: 523,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg1.jpg',
          },
        },
      },
    },
  },
];
