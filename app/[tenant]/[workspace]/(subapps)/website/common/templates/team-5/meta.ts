import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const team5Schema = {
  title: 'Team 5',
  code: 'team5',
  type: Template.block,
  fields: [
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team5Member',
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
  models: [
    {
      name: 'Team5Member',
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

export type Team5Data = Data<typeof team5Schema>;

export const team5Demos: Demo<typeof team5Schema>[] = [
  {
    language: 'en_US',
    data: {
      team5Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            designation: 'Developer',
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
            name: 'Anna Trois',
            designation: 'UI and UX Designer',
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
            name: 'Sonal Ocer',
            designation: 'Sr. Marketing Manager',
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
            name: 'Inan Rocketich',
            designation: 'Advisor',
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
      team5Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            designation: 'Développeur',
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
            name: 'Anna Trois',
            designation: 'Concepteur UI et UX',
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
            name: 'Sonal Ocer',
            designation: 'Responsable marketing senior',
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
            name: 'Inan Rocketich',
            designation: 'Conseiller',
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
