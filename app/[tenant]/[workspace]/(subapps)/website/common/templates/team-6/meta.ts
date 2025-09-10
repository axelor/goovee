import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const team6Schema = {
  title: 'Team 6',
  code: 'team6',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team6Member',
    },
  ],
  models: [
    {
      name: 'Team6Member',
      title: 'Member',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'designation',
          title: 'Designation',
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
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Team6Data = Data<typeof team6Schema>;

export const team6Demos: Demo<typeof team6Schema>[] = [
  {
    language: 'en_US',
    data: {
      team6Caption: 'Our Team',
      team6Title:
        'Look beyond the box and get creative. Lighthouse can help you create an influence.',
      team6Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Financial Analyst',
            image: {
              id: '1',
              version: 1,
              fileName: 't1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Marketing Specialist',
            image: {
              id: '1',
              version: 1,
              fileName: 't2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Sales Manager',
            image: {
              id: '1',
              version: 1,
              fileName: 't3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Investment Planner',
            image: {
              id: '1',
              version: 1,
              fileName: 't4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t4.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      team6Caption: 'Notre équipe',
      team6Title:
        'Sortez des sentiers battus et soyez créatif. Lighthouse peut vous aider à créer une influence.',
      team6Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Analyste financier',
            image: {
              id: '1',
              version: 1,
              fileName: 't1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Spécialiste du marketing',
            image: {
              id: '1',
              version: 1,
              fileName: 't2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Directeur des ventes',
            image: {
              id: '1',
              version: 1,
              fileName: 't3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Planificateur d’investissement',
            image: {
              id: '1',
              version: 1,
              fileName: 't4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t4.jpg',
            },
          },
        },
      ],
    },
  },
];
