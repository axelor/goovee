import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';

export const clientlist5Code = 'clientlist5';

export const clientlist5Schema = {
  title: 'Client List 5',
  code: clientlist5Code,
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
      name: 'description',
      title: 'Description',
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-15 py-md-17',
    },
  ],
  models: [clientsModel],
} as const satisfies TemplateSchema;

export type Clientlist5Data = Data<typeof clientlist5Schema>;

export const clientlist5Demos: Demo<typeof clientlist5Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-20',
    sequence: 5,
    data: {
      clientlist5Title: '300+ customers have given faith in us.',
      clientlist5Caption: 'Our Clients',
      clientlist5Description:
        "We create ideas that make our clients' lives better.",
      clientlist5Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z1.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z2.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z3.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z4.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z5.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z6.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z7.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Client logo',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z8.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z8.png',
                },
              },
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-20',
    sequence: 5,
    data: {
      clientlist5Title: 'Plus de 300 clients nous ont fait confiance.',
      clientlist5Caption: 'Nos clients',
      clientlist5Description:
        'Nous créons des idées qui améliorent la vie de nos clients.',
      clientlist5Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z1.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z2.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z3.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z4.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z5.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z6.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z7.png',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Logo du client',
                width: 450,
                height: 301,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'z8.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z8.png',
                },
              },
            },
          },
        },
      ],
    },
  },
];
