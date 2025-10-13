import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {clientsModel, imageModel} from '../json-models';

export const hero21Code = 'hero21';

export const hero21Schema = {
  title: 'Hero 21',
  code: hero21Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'rotatingTitle',
      title: 'Rotating Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'listTitle',
      title: 'List Title',
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
      defaultValue: 'container pt-10 pt-md-14 pb-14 pb-md-16 text-center',
    },
  ],
  models: [clientsModel, imageModel],
} as const satisfies TemplateSchema;

export type Hero21Data = Data<typeof hero21Schema>;

export const hero21Demos: Demo<typeof hero21Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-21',
    sequence: 1,
    data: {
      hero21Title: 'A tech company that focuses on',
      hero21RotatingTitle: 'mobile design,web design,3D animation',
      hero21Description:
        'We are a design firm with a deep trust in the strength of original thinking.',
      hero21ButtonLabel: 'Get Started',
      hero21ButtonLink: '#',
      hero21Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Tech company',
          width: 671,
          height: 492,
          image: {
            id: '1',
            version: 1,
            fileName: 'i21.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i21.png',
          },
        },
      },
      hero21ListTitle: 'Our Core Partners',
      hero21Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'client',
                width: 272,
                height: 80,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c1.png',
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
                alt: 'client',
                width: 252,
                height: 88,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c2.png',
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
                alt: 'client',
                width: 250,
                height: 70,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c3.png',
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
                alt: 'client',
                width: 268,
                height: 72,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c4.png',
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
                alt: 'client',
                width: 194,
                height: 62,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c5.png',
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
                alt: 'client',
                width: 258,
                height: 60,
                image: {
                  id: '1',
                  version: 1,
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
    site: 'fr',
    page: 'demo-21',
    sequence: 1,
    data: {
      hero21Title: 'Une entreprise technologique qui se concentre sur',
      hero21RotatingTitle: 'le design mobile, le design web, l’animation 3D',
      hero21Description:
        'Nous sommes une entreprise de design qui a une profonde confiance dans la force de la pensée originale.',
      hero21ButtonLabel: 'Commencer',
      hero21ButtonLink: '#',
      hero21Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Entreprise technologique',
          width: 671,
          height: 492,
          image: {
            id: '1',
            version: 1,
            fileName: 'i21.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i21.png',
          },
        },
      },
      hero21ListTitle: 'Nos principaux partenaires',
      hero21Clients: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Client 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'client',
                width: 272,
                height: 80,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c1.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c1.png',
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
                alt: 'client',
                width: 252,
                height: 88,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c2.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c2.png',
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
                alt: 'client',
                width: 250,
                height: 70,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c3.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c3.png',
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
                alt: 'client',
                width: 268,
                height: 72,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c4.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c4.png',
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
                alt: 'client',
                width: 194,
                height: 62,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'c5.png',
                  fileType: 'image/png',
                  filePath: '/img/brands/c5.png',
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
                alt: 'client',
                width: 258,
                height: 60,
                image: {
                  id: '1',
                  version: 1,
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
