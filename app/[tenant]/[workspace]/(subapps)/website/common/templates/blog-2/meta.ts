import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const blog2Code = 'blog2';

export const blog2Schema = {
  title: 'Blog 2',
  code: blog2Code,
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
      name: 'spaceBetween',
      title: 'Space Between',
      type: 'integer',
    },
    {
      name: 'blogList',
      title: 'Blog List',
      type: 'json-one-to-many',
      target: 'Blog2BlogList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray mt-md-n21 pt-md-21',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-16',
    },
  ],
  models: [
    {
      name: 'Blog2BlogList',
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
          name: 'description',
          title: 'Description',
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
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Blog2Data = Data<typeof blog2Schema>;

export const blog2Demos: Demo<typeof blog2Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-11',
    sequence: 6,
    data: {
      blog2Caption: 'Case Studies',
      blog2Title:
        'Take a look at a few of our excellent works with excellent designs and innovative concepts.',
      blog2Navigation: false,
      blog2SpaceBetween: 0,
      blog2BlogList: [
        {
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Coding',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-04-14',
            image: {
              attrs: {
                alt: 'Blog post image',
                width: 775,
                height: 485,
                image: {
                  fileName: 'b4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b4.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Workspace',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-03-29',
            image: {
              attrs: {
                alt: 'Blog post image',
                width: 380,
                height: 240,
                image: {
                  fileName: 'b5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Meeting',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-02-26',
            image: {
              attrs: {
                alt: 'Blog post image',
                width: 380,
                height: 240,
                image: {
                  fileName: 'b6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b6.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Business Tips',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-01-07',
            image: {
              attrs: {
                alt: 'Blog post image',
                width: 480,
                height: 300,
                image: {
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
    site: 'lighthouse-fr',
    page: 'demo-11',
    sequence: 6,
    data: {
      blog2Caption: 'Études de cas',
      blog2Title:
        'Jetez un œil à quelques-unes de nos excellentes œuvres avec d’excellents designs et des concepts innovants.',
      blog2Navigation: false,
      blog2SpaceBetween: 0,
      blog2BlogList: [
        {
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Codage',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-04-14',
            image: {
              attrs: {
                alt: "Image de l'article de blog",
                width: 775,
                height: 485,
                image: {
                  fileName: 'b4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b4.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Espace de travail',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-03-29',
            image: {
              attrs: {
                alt: "Image de l'article de blog",
                width: 380,
                height: 240,
                image: {
                  fileName: 'b5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Réunion',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-02-26',
            image: {
              attrs: {
                alt: "Image de l'article de blog",
                width: 380,
                height: 240,
                image: {
                  fileName: 'b6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b6.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Conseils aux entreprises',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-01-07',
            image: {
              attrs: {
                alt: "Image de l'article de blog",
                width: 480,
                height: 300,
                image: {
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
