import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const clientlist4Schema = {
  title: 'Client List 4',
  code: 'clientlist4',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [clientsModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Clientlist4Data = Data<typeof clientlist4Schema>;

export const clientlist4Demos: Demo<typeof clientlist4Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-13',
    sequence: 7,
    data: {
      clientlist4Title: '300+ customers have given faith in us.',
      clientlist4Caption:
        "We create ideas that make our clients' lives better.",
      clientlist4Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'z1.png',
              fileType: 'image/png',
              filePath: '/img/brands/z1.png',
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
              fileName: 'z2.png',
              fileType: 'image/png',
              filePath: '/img/brands/z2.png',
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
              fileName: 'z3.png',
              fileType: 'image/png',
              filePath: '/img/brands/z3.png',
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
              fileName: 'z4.png',
              fileType: 'image/png',
              filePath: '/img/brands/z4.png',
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
              fileName: 'z5.png',
              fileType: 'image/png',
              filePath: '/img/brands/z5.png',
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
              fileName: 'z6.png',
              fileType: 'image/png',
              filePath: '/img/brands/z6.png',
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
              fileName: 'z7.png',
              fileType: 'image/png',
              filePath: '/img/brands/z7.png',
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
              fileName: 'z8.png',
              fileType: 'image/png',
              filePath: '/img/brands/z8.png',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-13',
    sequence: 7,
    data: {
      clientlist4Title: 'Plus de 300 clients nous ont fait confiance.',
      clientlist4Caption:
        'Nous créons des idées qui améliorent la vie de nos clients.',
      clientlist4Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'z1.png',
              fileType: 'image/png',
              filePath: '/img/brands/z1.png',
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
              fileName: 'z2.png',
              fileType: 'image/png',
              filePath: '/img/brands/z2.png',
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
              fileName: 'z3.png',
              fileType: 'image/png',
              filePath: '/img/brands/z3.png',
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
              fileName: 'z4.png',
              fileType: 'image/png',
              filePath: '/img/brands/z4.png',
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
              fileName: 'z5.png',
              fileType: 'image/png',
              filePath: '/img/brands/z5.png',
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
              fileName: 'z6.png',
              fileType: 'image/png',
              filePath: '/img/brands/z6.png',
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
              fileName: 'z7.png',
              fileType: 'image/png',
              filePath: '/img/brands/z7.png',
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
              fileName: 'z8.png',
              fileType: 'image/png',
              filePath: '/img/brands/z8.png',
            },
          },
        },
      ],
    },
  },
];
