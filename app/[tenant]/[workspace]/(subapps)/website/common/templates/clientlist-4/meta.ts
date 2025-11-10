import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';

export const clientlist4Code = 'clientlist4';

export const clientlist4Schema = {
  title: 'Client List 4',
  code: clientlist4Code,
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
} as const satisfies TemplateSchema;

export type Clientlist4Data = Data<typeof clientlist4Schema>;

export const clientlist4Demos: Demo<typeof clientlist4Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-13',
    sequence: 7,
    data: {
      clientlist4Title: '300+ customers have given faith in us.',
      clientlist4Caption:
        "We create ideas that make our clients' lives better.",
      clientlist4Clients: [
        {
          attrs: {
            name: 'Client 1',
            image: {
              attrs: {
                alt: 'Client 1',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z1.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 2',
            image: {
              attrs: {
                alt: 'Client 2',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z2.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 3',
            image: {
              attrs: {
                alt: 'Client 3',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z3.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 4',
            image: {
              attrs: {
                alt: 'Client 4',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z4.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 5',
            image: {
              attrs: {
                alt: 'Client 5',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z5.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 6',
            image: {
              attrs: {
                alt: 'Client 6',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z6.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 7',
            image: {
              attrs: {
                alt: 'Client 7',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z7.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 8',
            image: {
              attrs: {
                alt: 'Client 8',
                width: 450,
                height: 301,
                image: {
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
    site: 'lighthouse-fr',
    page: 'demo-13',
    sequence: 7,
    data: {
      clientlist4Title: 'Plus de 300 clients nous ont fait confiance.',
      clientlist4Caption:
        'Nous créons des idées qui améliorent la vie de nos clients.',
      clientlist4Clients: [
        {
          attrs: {
            name: 'Client 1',
            image: {
              attrs: {
                alt: 'Client 1',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z1.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 2',
            image: {
              attrs: {
                alt: 'Client 2',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z2.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 3',
            image: {
              attrs: {
                alt: 'Client 3',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z3.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 4',
            image: {
              attrs: {
                alt: 'Client 4',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z4.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 5',
            image: {
              attrs: {
                alt: 'Client 5',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z5.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 6',
            image: {
              attrs: {
                alt: 'Client 6',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z6.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 7',
            image: {
              attrs: {
                alt: 'Client 7',
                width: 450,
                height: 301,
                image: {
                  fileName: 'z7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/z7.png',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Client 8',
            image: {
              attrs: {
                alt: 'Client 8',
                width: 450,
                height: 301,
                image: {
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
