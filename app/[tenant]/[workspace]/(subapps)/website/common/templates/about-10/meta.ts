import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {progressListModel} from '../json-models';
import {buttonColorSelection} from '../meta-selections';

export const about10Schema = {
  title: 'About 10',
  code: 'about10',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'btnColor',
      title: 'Button Color',
      type: 'string',
      selection: 'button-colors',
    },
    {
      name: 'media',
      title: 'Media',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'hideShape',
      title: 'Hide Shape',
      type: 'boolean',
    },
    {
      name: 'progressList',
      title: 'Progress List',
      target: 'ProgressList',
      type: 'json-one-to-many',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
    },
  ],
  models: [progressListModel],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection],
} as const satisfies TemplateSchema;

export type About10Data = Data<typeof about10Schema>;

export const about10Demos: Demo<typeof about10Schema>[] = [
  {
    language: 'en_US',
    data: {
      about10Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      about10Caption: 'The Lighthouse is Fabulous',
      about10Title:
        'We designed our strategies to help you at each stage of achievement.',
      about10BtnColor: 'white',
      about10Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about10HideShape: false,
      about10ProgressList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Marketing',
            percent: 100,
            color: 'blue',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Strategy',
            percent: 80,
            color: 'yellow',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Development',
            percent: 85,
            color: 'orange',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      about10Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      about10Caption: 'Le phare est fabuleux',
      about10Title:
        'Nous avons conçu nos stratégies pour vous aider à chaque étape de votre réussite.',
      about10BtnColor: 'white',
      about10Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about10HideShape: false,
      about10ProgressList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Marketing',
            percent: 100,
            color: 'blue',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Stratégie',
            percent: 80,
            color: 'yellow',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Développement',
            percent: 85,
            color: 'orange',
          },
        },
      ],
    },
  },
];
