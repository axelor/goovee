import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const facts9Schema = {
  title: 'Facts 9',
  code: 'facts9',
  type: Template.block,
  fields: [
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts9Facts',
    },
  ],
  models: [
    {
      name: 'Facts9Facts',
      title: 'Facts',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'amount',
          title: 'Amount',
          type: 'integer',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Facts9Data = Data<typeof facts9Schema>;

export const facts9Demos: Demo<typeof facts9Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts9BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      facts9Image: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      facts9Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            amount: 7518,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Satisfied Customers',
            amount: 3472,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            amount: 2184,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Awards Won',
            amount: 4523,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      facts9BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      facts9Image: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      facts9Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            amount: 7518,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients satisfaits',
            amount: 3472,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            amount: 2184,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            amount: 4523,
          },
        },
      ],
    },
  },
];
