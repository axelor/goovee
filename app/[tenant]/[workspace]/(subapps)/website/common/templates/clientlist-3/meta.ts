import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const clientlist3Schema = {
  title: 'Client List 3',
  code: 'clientlist3',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'clients',
      title: 'Clients',
      type: 'json-one-to-many',
      target: 'Clients',
    },
  ],
  models: [clientsModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Clientlist3Data = Data<typeof clientlist3Schema>;

export const clientlist3Demos: Demo<typeof clientlist3Schema>[] = [
  {
    language: 'en_US',
    data: {
      clientlist3Caption: 'OUR PARTNERS',
      clientlist3Clients: [
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
      clientlist3Caption: 'NOS PARTENAIRES',
      clientlist3Clients: [
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
