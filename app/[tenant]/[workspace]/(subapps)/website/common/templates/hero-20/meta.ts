import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero20Schema = {
  title: 'Hero 20',
  code: 'hero20',
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
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'poster',
      title: 'Poster',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero20Data = Data<typeof hero20Schema>;

export const hero20Demos: Demo<typeof hero20Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero20Title: 'Swift Responses,Creative Thinking,Top-Notch Support',
      hero20Description:
        'Our area of expertise lies in digital services such as web design, mobile app development, and SEO optimization.',
      hero20Video: {
        id: '1',
        version: 1,
        fileName: 'movie2.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie2.mp4',
      },
      hero20Poster: {
        id: '1',
        version: 1,
        fileName: 'movie2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/movie2.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero20Title:
        'Réponses rapides, pensée créative, support de premier ordre',
      hero20Description:
        'Notre domaine d’expertise réside dans les services numériques tels que la conception de sites web, le développement d’applications mobiles et l’optimisation SEO.',
      hero20Video: {
        id: '1',
        version: 1,
        fileName: 'movie2.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie2.mp4',
      },
      hero20Poster: {
        id: '1',
        version: 1,
        fileName: 'movie2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/movie2.jpg',
      },
    },
  },
];
