import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero24Code = 'hero24';

export const hero24Schema = {
  title: 'Hero 24',
  code: hero24Code,
  type: Template.block,
  fields: [
    {
      name: 'images',
      title: 'Images',
      type: 'json-one-to-many',
      target: 'Hero24Images',
    },
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray overflow-hidden',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container-fluid px-xl-0 pt-6 pb-10',
    },
  ],
  models: [
    {
      name: 'Hero24Images',
      title: 'Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Hero24Data = Data<typeof hero24Schema>;

export const hero24Demos: Demo<typeof hero24Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-24',
    sequence: 1,
    data: {
      hero24Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Image 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf1.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Image 2',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf2.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Image 3',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf3.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Image 4',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf4.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Image 5',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf5.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Image 6',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Carousel image',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf6.jpg',
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
    page: 'demo-24',
    sequence: 1,
    data: {
      hero24Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Image 1',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf1.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Image 2',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf2.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Image 3',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 790,
                height: 531,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf3.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Image 4',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf4.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Image 5',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf5.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Image 6',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Image du carrousel',
                width: 1200,
                height: 800,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'cf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/cf6.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
