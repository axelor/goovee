import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const blog4Code = 'blog4';

export const blog4Schema = {
  title: 'Blog 4',
  code: blog4Code,
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
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'blogList',
      title: 'Blog List',
      type: 'json-one-to-many',
      target: 'Blog4BlogList',
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
      defaultValue: 'container mb-17 mb-md-20',
    },
  ],
  models: [
    {
      name: 'Blog4BlogList',
      title: 'Blog List',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'date',
          title: 'Date',
          type: 'date',
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

export type Blog4Data = Data<typeof blog4Schema>;

export const blog4Demos: Demo<typeof blog4Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-18',
    sequence: 7,
    data: {
      blog4Caption: 'Case Studies',
      blog4Title:
        'Take a look at a few of our excellent works with excellent designs and innovative concepts.',
      blog4Navigation: false,
      blog4BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Coding',
            date: '2022-04-14',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Blog post image',
                width: 775,
                height: 485,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b4.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Workspace',
            date: '2022-03-29',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Blog post image',
                width: 380,
                height: 240,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b5.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Meeting',
            date: '2022-02-26',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Blog post image',
                width: 380,
                height: 240,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b6.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Business Tips',
            date: '2022-01-07',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Blog post image',
                width: 480,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b7.jpg',
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
    page: 'demo-18',
    sequence: 7,
    data: {
      blog4Caption: 'Études de cas',
      blog4Title:
        'Jetez un œil à quelques-unes de nos excellentes œuvres avec d’excellents designs et des concepts innovants.',
      blog4Navigation: false,
      blog4BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Codage',
            date: '2022-04-14',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: "Image de l'article de blog",
                width: 775,
                height: 485,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b4.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Espace de travail',
            date: '2022-03-29',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: "Image de l'article de blog",
                width: 380,
                height: 240,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b5.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Réunion',
            date: '2022-02-26',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: "Image de l'article de blog",
                width: 380,
                height: 240,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b6.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Conseils aux entreprises',
            date: '2022-01-07',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: "Image de l'article de blog",
                width: 480,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'b7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b7.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
