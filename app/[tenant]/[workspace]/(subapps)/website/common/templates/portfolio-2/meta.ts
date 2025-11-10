import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio2Code = 'portfolio2';

export const portfolio2Schema = {
  title: 'Portfolio 2',
  code: portfolio2Code,
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'slidesPerView',
      title: 'Slides Per View',
      type: 'integer',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'carouselImages',
      title: 'Carousel Images',
      type: 'json-one-to-many',
      target: 'Portfolio2CarouselImages',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper overflow-hidden',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-9 pb-md-14',
    },
  ],
  models: [
    {
      name: 'Portfolio2CarouselImages',
      title: 'Carousel Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio2Data = Data<typeof portfolio2Schema>;

export const portfolio2Demos: Demo<typeof portfolio2Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-7',
    sequence: 4,
    data: {
      portfolio2Caption: 'Our Recent Portfolio',
      portfolio2SlidesPerView: 2,
      portfolio2Pagination: false,
      portfolio2CarouselImages: [
        {
          attrs: {
            name: 'Portfolio 1',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 1',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp17.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp17.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 2',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 2',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp18.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp18.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 3',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 3',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp19.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp19.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 4',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 4',
                width: 1100,
                height: 770,
                image: {
                  fileName: 'pp20.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp20.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 5',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 5',
                width: 1100,
                height: 770,
                image: {
                  fileName: 'pp21.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp21.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 6',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 6',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp22.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp22.jpg',
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
    page: 'demo-7',
    sequence: 4,
    data: {
      portfolio2Caption: 'Notre portefeuille récent',
      portfolio2SlidesPerView: 2,
      portfolio2Pagination: false,
      portfolio2CarouselImages: [
        {
          attrs: {
            name: 'Portfolio 1',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 1',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp17.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp17.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 2',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 2',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp18.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp18.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 3',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 3',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp19.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp19.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 4',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 4',
                width: 1100,
                height: 770,
                image: {
                  fileName: 'pp20.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp20.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 5',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 5',
                width: 1100,
                height: 770,
                image: {
                  fileName: 'pp21.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp21.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Portfolio 6',
            url: '#',
            image: {
              attrs: {
                alt: 'Portfolio 6',
                width: 1170,
                height: 819,
                image: {
                  fileName: 'pp22.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp22.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
