import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {progressListModel, imageModel} from '../json-models';

export const about5Code = 'about5';

export const about5Schema = {
  title: 'About 5',
  code: about5Code,
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
      type: 'json-many-to-one',
      target: 'Image',
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
  models: [progressListModel, imageModel],
} as const satisfies TemplateSchema;

export type About5Data = Data<typeof about5Schema>;

export const about5Demos: Demo<typeof about5Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 1,
    data: {
      about5Title:
        'We bring rapid solutions to make the life of our customers easier.',
      about5Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Rapid solutions for customers',
          width: 600,
          height: 428,
          image: {
            id: '1',
            version: 1,
            fileName: 'i8.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i8.png',
          },
        },
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
            color: 'yellow',
            title: 'Strategy',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            percent: 85,
            color: 'orange',
            title: 'Development',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            percent: 90,
            color: 'green',
            title: 'Data Analysis',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 1,
    data: {
      about5Title:
        'Nous apportons des solutions rapides pour faciliter la vie de nos clients.',
      about5Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Solutions rapides pour les clients',
          width: 600,
          height: 428,
          image: {
            id: '1',
            version: 1,
            fileName: 'i8.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i8.png',
          },
        },
      },
      about5ProgressList: [
        {
          id: '1',
          version: 0,
          attrs: {
            percent: 100,
            color: 'blue',
            title: 'Marketing',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            percent: 80,
            color: 'yellow',
            title: 'Stratégie',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            percent: 85,
            color: 'orange',
            title: 'Développement',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            percent: 90,
            color: 'green',
            title: 'Analyse de données',
          },
        },
      ],
    },
  },
];
