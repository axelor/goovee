import {
  Data,
  Demo,
  Template,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';

export const clients1Schema = {
  title: 'Clients 1',
  code: 'clients1',
  type: Template.block,
  fields: [
    {
      name: 'clientList',
      title: 'Client List',
      type: 'json-one-to-many',
      target: 'Clients1ClientList',
    },
  ],
  models: [
    {
      name: 'Clients1ClientList',
      title: 'Client List',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
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

export type Clients1Data = Data<typeof clients1Schema>;

export const clients1Demos: Demo<typeof clients1Schema>[] = [
  {
    language: 'en_US',
    data: {
      clients1ClientList: [
        {
          id: '18',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c1.png',
              fileType: 'image/png',
              filePath: '/img/brands/c1.png',
            },
            name: 'Client 1',
          },
        },
        {
          id: '19',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c2.png',
              fileType: 'image/png',
              filePath: '/img/brands/c2.png',
            },
            name: 'Client 2',
          },
        },
        {
          id: '20',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c3.png',
              fileType: 'image/png',
              filePath: '/img/brands/c3.png',
            },
            name: 'Client 3',
          },
        },
        {
          id: '21',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c4.png',
              fileType: 'image/png',
              filePath: '/img/brands/c4.png',
            },
            name: 'Client 4',
          },
        },
        {
          id: '22',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c5.png',
              fileType: 'image/png',
              filePath: '/img/brands/c5.png',
            },
            name: 'Client 5',
          },
        },
        {
          id: '23',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c6.png',
              fileType: 'image/png',
              filePath: '/img/brands/c6.png',
            },
            name: 'Client 6',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      clients1ClientList: [
        {
          id: '18',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c1.png',
              fileType: 'image/png',
              filePath: '/img/brands/c1.png',
            },
            name: 'Client 1',
          },
        },
        {
          id: '19',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c2.png',
              fileType: 'image/png',
              filePath: '/img/brands/c2.png',
            },
            name: 'Client 2',
          },
        },
        {
          id: '20',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c3.png',
              fileType: 'image/png',
              filePath: '/img/brands/c3.png',
            },
            name: 'Client 3',
          },
        },
        {
          id: '21',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c4.png',
              fileType: 'image/png',
              filePath: '/img/brands/c4.png',
            },
            name: 'Client 4',
          },
        },
        {
          id: '22',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c5.png',
              fileType: 'image/png',
              filePath: '/img/brands/c5.png',
            },
            name: 'Client 5',
          },
        },
        {
          id: '23',
          version: 0,
          attrs: {
            image: {
              id: '1',
              version: 1,
              fileName: 'c6.png',
              fileType: 'image/png',
              filePath: '/img/brands/c6.png',
            },
            name: 'Client 6',
          },
        },
      ],
    },
  },
];
