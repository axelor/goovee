import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel} from '../json-models';

export const clientlist3Code = 'clientlist3';

export const clientlist3Schema = {
  title: 'Client List 3',
  code: clientlist3Code,
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
      defaultValue: 'container pt-14 pt-md-17 mb-14 mb-md-19',
    },
  ],
  models: [clientsModel],
} as const satisfies TemplateSchema;

export type Clientlist3Data = Data<typeof clientlist3Schema>;

export const clientlist3Demos: Demo<typeof clientlist3Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-9',
    sequence: 2,
    data: {
      clientlist3Caption: 'OUR PARTNERS',
      clientlist3Clients: [
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
    page: 'demo-9',
    sequence: 2,
    data: {
      clientlist3Caption: 'NOS PARTENAIRES',
      clientlist3Clients: [
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
