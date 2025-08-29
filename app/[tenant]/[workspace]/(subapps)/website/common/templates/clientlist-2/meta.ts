import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const clientlist2Schema = {
  title: 'Client List 2',
  code: 'clientlist2',
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
      name: 'clients',
      title: 'Clients',
      type: 'json-one-to-many',
      target: 'Clients',
    },
  ],
  models: [clientsModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Clientlist2Data = Data<typeof clientlist2Schema>;

export const clientlist2Demos: Demo<typeof clientlist2Schema>[] = [
  {
    language: 'en_US',
    data: {
      clientlist2Title: 'Over 20,000 customers have trusted in us.',
      clientlist2Caption:
        'We provide ideas that make life for our customers easier.',
      clientlist2Clients: [
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
        {
          id: '7',
          version: 0,
          attrs: {
            name: 'Client 7',
            image: {
              id: '1',
              version: 1,
              fileName: 'c7.png',
              fileType: 'image/png',
              filePath: '/img/brands/c7.png',
            },
          },
        },
        {
          id: '8',
          version: 0,
          attrs: {
            name: 'Client 8',
            image: {
              id: '1',
              version: 1,
              fileName: 'c8.png',
              fileType: 'image/png',
              filePath: '/img/brands/c8.png',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      clientlist2Title: 'Plus de 20 000 clients nous ont fait confiance.',
      clientlist2Caption:
        'Nous proposons des idées qui facilitent la vie de nos clients.',
      clientlist2Clients: [
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
        {
          id: '7',
          version: 0,
          attrs: {
            name: 'Client 7',
            image: {
              id: '1',
              version: 1,
              fileName: 'c7.png',
              fileType: 'image/png',
              filePath: '/img/brands/c7.png',
            },
          },
        },
        {
          id: '8',
          version: 0,
          attrs: {
            name: 'Client 8',
            image: {
              id: '1',
              version: 1,
              fileName: 'c8.png',
              fileType: 'image/png',
              filePath: '/img/brands/c8.png',
            },
          },
        },
      ],
    },
  },
];
