import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';

export const clientlist2Code = 'clientlist2';

export const clientlist2Schema = {
  title: 'Client List 2',
  code: clientlist2Code,
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-13 mb-md-17',
    },
  ],
  models: [clientsModel],
} as const satisfies TemplateSchema;

export type Clientlist2Data = Data<typeof clientlist2Schema>;

export const clientlist2Demos: Demo<typeof clientlist2Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-8',
    sequence: 2,
    data: {
      clientlist2Title: 'Over 20,000 customers have trusted in us.',
      clientlist2Caption:
        'We provide ideas that make life for our customers easier.',
      clientlist2Clients: [
        {
          attrs: {
            name: 'Client 1',
            image: {
              attrs: {
                alt: 'Client logo',
                width: 272,
                height: 80,
                image: {
                  fileName: 'c1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c1.png',
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
                alt: 'Client logo',
                width: 252,
                height: 88,
                image: {
                  fileName: 'c2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c2.png',
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
                alt: 'Client logo',
                width: 250,
                height: 70,
                image: {
                  fileName: 'c3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c3.png',
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
                alt: 'Client logo',
                width: 268,
                height: 72,
                image: {
                  fileName: 'c4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c4.png',
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
                alt: 'Client logo',
                width: 194,
                height: 62,
                image: {
                  fileName: 'c5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c5.png',
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
                alt: 'Client logo',
                width: 258,
                height: 60,
                image: {
                  fileName: 'c6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c6.png',
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
                alt: 'Client logo',
                width: 212,
                height: 66,
                image: {
                  fileName: 'c7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c7.png',
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
                alt: 'Client logo',
                width: 228,
                height: 70,
                image: {
                  fileName: 'c8.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c8.png',
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
    page: 'demo-8',
    sequence: 2,
    data: {
      clientlist2Title: 'Plus de 20 000 clients nous ont fait confiance.',
      clientlist2Caption:
        'Nous proposons des idées qui facilitent la vie de nos clients.',
      clientlist2Clients: [
        {
          attrs: {
            name: 'Client 1',
            image: {
              attrs: {
                alt: 'Logo du client',
                width: 272,
                height: 80,
                image: {
                  fileName: 'c1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c1.png',
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
                alt: 'Logo du client',
                width: 252,
                height: 88,
                image: {
                  fileName: 'c2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c2.png',
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
                alt: 'Logo du client',
                width: 250,
                height: 70,
                image: {
                  fileName: 'c3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c3.png',
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
                alt: 'Logo du client',
                width: 268,
                height: 72,
                image: {
                  fileName: 'c4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c4.png',
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
                alt: 'Logo du client',
                width: 194,
                height: 62,
                image: {
                  fileName: 'c5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c5.png',
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
                alt: 'Logo du client',
                width: 258,
                height: 60,
                image: {
                  fileName: 'c6.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c6.png',
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
                alt: 'Logo du client',
                width: 212,
                height: 66,
                image: {
                  fileName: 'c7.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c7.png',
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
                alt: 'Logo du client',
                width: 228,
                height: 70,
                image: {
                  fileName: 'c8.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c8.png',
                },
              },
            },
          },
        },
      ],
    },
  },
];
