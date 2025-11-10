import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const service6Code = 'service6';

export const service6Schema = {
  title: 'Service 6',
  code: service6Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'image1',
      title: 'Image 1',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'image3',
      title: 'Image 3',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'serviceList',
      title: 'Service List',
      type: 'json-many-to-one',
      target: 'BulletList',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
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
      defaultValue: 'container pb-14 pb-md-16 mb-lg-21 mb-xl-23',
    },
  ],
  models: [bulletListModel, imageModel],
} as const satisfies TemplateSchema;

export type Service6Data = Data<typeof service6Schema>;

export const service6Demos: Demo<typeof service6Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-5',
    sequence: 2,
    data: {
      service6Title:
        'The service we offer is specifically designed to meet your needs.',
      service6Description:
        'We have a landscape-oriented flyer design that will help you reach a wider audience and increase your sales.',
      service6Image1: {
        attrs: {
          alt: 'Service',
          width: 280,
          height: 338,
          image: {
            fileName: 'sa13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa13.jpg',
          },
        },
      },
      service6Image2: {
        attrs: {
          alt: 'Service',
          width: 270,
          height: 165,
          image: {
            fileName: 'sa14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa14.jpg',
          },
        },
      },
      service6Image3: {
        attrs: {
          alt: 'Service',
          width: 225,
          height: 271,
          image: {
            fileName: 'sa15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa15.jpg',
          },
        },
      },
      service6ServiceList: {
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-5',
    sequence: 2,
    data: {
      service6Title:
        'Le service que nous proposons est spécialement conçu pour répondre à vos besoins.',
      service6Description:
        'Nous avons un modèle de flyer orienté paysage qui vous aidera à toucher un public plus large et à augmenter vos ventes.',
      service6Image1: {
        attrs: {
          alt: 'Service',
          width: 280,
          height: 338,
          image: {
            fileName: 'sa13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa13.jpg',
          },
        },
      },
      service6Image2: {
        attrs: {
          alt: 'Service',
          width: 270,
          height: 165,
          image: {
            fileName: 'sa14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa14.jpg',
          },
        },
      },
      service6Image3: {
        attrs: {
          alt: 'Service',
          width: 225,
          height: 271,
          image: {
            fileName: 'sa15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa15.jpg',
          },
        },
      },
      service6ServiceList: {
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-10',
    sequence: 3,
    data: {
      service6Title:
        'The service we offer is specifically designed to meet your needs.',
      service6Description:
        'We have a landscape-oriented flyer design that will help you reach a wider audience and increase your sales.',
      service6ContainerClassName: 'container py-14 py-md-17',
      service6Image1: {
        attrs: {
          alt: 'Service',
          width: 280,
          height: 338,
          image: {
            fileName: 'sa13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa13.jpg',
          },
        },
      },
      service6Image2: {
        attrs: {
          alt: 'Service',
          width: 270,
          height: 165,
          image: {
            fileName: 'sa14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa14.jpg',
          },
        },
      },
      service6Image3: {
        attrs: {
          alt: 'Service',
          width: 225,
          height: 271,
          image: {
            fileName: 'sa15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa15.jpg',
          },
        },
      },
      service6ServiceList: {
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-10',
    sequence: 3,
    data: {
      service6Title:
        'Le service que nous proposons est spécialement conçu pour répondre à vos besoins.',
      service6Description:
        'Nous avons un modèle de flyer orienté paysage qui vous aidera à toucher un public plus large et à augmenter vos ventes.',
      service6ContainerClassName: 'container py-14 py-md-17',
      service6Image1: {
        attrs: {
          alt: 'Service',
          width: 280,
          height: 338,
          image: {
            fileName: 'sa13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa13.jpg',
          },
        },
      },
      service6Image2: {
        attrs: {
          alt: 'Service',
          width: 270,
          height: 165,
          image: {
            fileName: 'sa14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa14.jpg',
          },
        },
      },
      service6Image3: {
        attrs: {
          alt: 'Service',
          width: 225,
          height: 271,
          image: {
            fileName: 'sa15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa15.jpg',
          },
        },
      },
      service6ServiceList: {
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
];
