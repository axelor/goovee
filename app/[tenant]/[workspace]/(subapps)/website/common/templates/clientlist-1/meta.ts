import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';

export const clientlist1Code = 'clientlist1';

export const clientlist1Schema = {
  title: 'Client List 1',
  code: clientlist1Code,
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
      defaultValue: 'wrapper bg-light angled lower-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container px-lg-5 pb-14 pb-md-18',
    },
  ],
  models: [clientsModel],
} as const satisfies TemplateSchema;

export type Clientlist1Data = Data<typeof clientlist1Schema>;

export const clientlist1Demos: Demo<typeof clientlist1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-1',
    sequence: 11,
    data: {
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-1',
    sequence: 11,
    data: {
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-2',
    sequence: 2,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 mb-14 mb-md-17',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-2',
    sequence: 2,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 mb-14 mb-md-17',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-4',
    sequence: 10,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light position-relative',
      clientlist1ContainerClassName: 'container px-lg-5 mb-14 mb-md-18',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-4',
    sequence: 10,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light position-relative',
      clientlist1ContainerClassName: 'container px-lg-5 mb-14 mb-md-18',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-5',
    sequence: 5,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 pb-14 pb-md-17',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-5',
    sequence: 5,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 pb-14 pb-md-17',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-10',
    sequence: 7,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 pb-16 pb-md-18',
      clientlist1Clients: [
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
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-10',
    sequence: 7,
    data: {
      clientlist1WrapperClassName: 'wrapper bg-light',
      clientlist1ContainerClassName: 'container px-lg-5 pb-16 pb-md-18',
      clientlist1Clients: [
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
      ],
    },
  },
];
