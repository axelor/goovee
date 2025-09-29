import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {progressListModel} from '../json-models';

export const about5Schema = {
  title: 'About 5',
  code: 'about5',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
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
      name: 'progressList',
      title: 'Progress List',
      target: 'ProgressList',
      type: 'json-one-to-many',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [progressListModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About5Data = Data<typeof about5Schema>;

export const about5Demos: Demo<typeof about5Schema>[] = [
  {
    language: 'en_US',
    page: 'others',
    sequence: 1,
    data: {
      about5Title:
        'We bring rapid solutions to make the life of our customers easier.',
      about5Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      about5ProgressList: [
        {
          id: '1',
          version: 0,
          attrs: {
            percent: 100,
            title: 'Marketing',
            color: 'blue',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            percent: 80,
            title: 'Strategy',
            color: 'yellow',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            percent: 85,
            title: 'Development',
            color: 'orange',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            percent: 90,
            title: 'Data Analysis',
            color: 'green',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'others',
    sequence: 1,
    data: {
      about5Title:
        'Nous apportons des solutions rapides pour faciliter la vie de nos clients.',
      about5Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      about5ProgressList: [
        {
          id: '1',
          version: 0,
          attrs: {
            percent: 100,
            title: 'Marketing',
            color: 'blue',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            percent: 80,
            title: 'Stratégie',
            color: 'yellow',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            percent: 85,
            title: 'Développement',
            color: 'orange',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            percent: 90,
            title: 'Analyse de données',
            color: 'green',
          },
        },
      ],
    },
  },
];
