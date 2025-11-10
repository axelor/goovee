import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const hero22Code = 'hero22';

export const hero22Schema = {
  title: 'Hero 22',
  code: hero22Code,
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
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper section-frame br-fix overflow-hidden',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-18 pt-lg-21 pb-17 pb-lg-19 text-center',
    },
  ],
  models: [imageModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero22Data = Data<typeof hero22Schema>;

export const hero22Demos: Demo<typeof hero22Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-22',
    sequence: 1,
    data: {
      hero22Title: 'Expand your business with our marketing services.',
      hero22Caption: 'Hello! We are here',
      hero22Video: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero22BackgroundImage: {
        attrs: {
          alt: 'Marketing services background',
          width: 1383,
          height: 734,
          image: {
            fileName: 'bg26.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg26.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-22',
    sequence: 1,
    data: {
      hero22Title:
        'Développez votre entreprise grâce à nos services marketing.',
      hero22Caption: 'Bonjour ! Nous sommes là',
      hero22Video: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero22BackgroundImage: {
        attrs: {
          alt: 'Arrière-plan des services marketing',
          width: 1383,
          height: 734,
          image: {
            fileName: 'bg26.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg26.jpg',
          },
        },
      },
    },
  },
];
