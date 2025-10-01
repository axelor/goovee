import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const clientlist1Schema = {
  title: 'Client List 1',
  code: 'clientlist1',
  type: Template.block,
  fields: [
    {
      name: 'clients',
      title: 'Clients',
      type: 'json-one-to-many',
      target: 'Clients',
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
  models: [clientsModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Clientlist1Data = Data<typeof clientlist1Schema>;

export const clientlist1Demos: Demo<typeof clientlist1Schema>[] = [
  {
    language: 'en_US',
    data: {
      clientlist1Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'c1.png',
              fileType: 'image/png',
              filePath: '/img/brands/c1.png',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Client 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'c2.png',
              fileType: 'image/png',
              filePath: '/img/brands/c2.png',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Client 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'c3.png',
              fileType: 'image/png',
              filePath: '/img/brands/c3.png',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Client 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'c4.png',
              fileType: 'image/png',
              filePath: '/img/brands/c4.png',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Client 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'c5.png',
              fileType: 'image/png',
              filePath: '/img/brands/c5.png',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Client 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'c6.png',
              fileType: 'image/png',
              filePath: '/img/brands/c6.png',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      clientlist1Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'c1.png',
              fileType: 'image/png',
              filePath: '/img/brands/c1.png',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Client 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'c2.png',
              fileType: 'image/png',
              filePath: '/img/brands/c2.png',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Client 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'c3.png',
              fileType: 'image/png',
              filePath: '/img/brands/c3.png',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Client 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'c4.png',
              fileType: 'image/png',
              filePath: '/img/brands/c4.png',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Client 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'c5.png',
              fileType: 'image/png',
              filePath: '/img/brands/c5.png',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Client 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'c6.png',
              fileType: 'image/png',
              filePath: '/img/brands/c6.png',
            },
          },
        },
      ],
    },
  },
];
