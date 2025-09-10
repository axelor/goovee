import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const blog2Schema = {
  title: 'Blog 2',
  code: 'blog2',
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
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Blog2Data = Data<typeof blog2Schema>;

export const blog2Demos: Demo<typeof blog2Schema>[] = [
  {
    language: 'en_US',
    data: {
      blog2Caption: 'Case Studies',
      blog2Title:
        'Take a look at a few of our excellent works with excellent designs and innovative concepts.',
      blog2Navigation: false,
      blog2SpaceBetween: 0,
      blog2BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Coding',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-04-14',
            image: {
              id: '1',
              version: 1,
              fileName: 'b4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b4.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Workspace',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-03-29',
            image: {
              id: '1',
              version: 1,
              fileName: 'b5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b5.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Meeting',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-02-26',
            image: {
              id: '1',
              version: 1,
              fileName: 'b6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b6.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Business Tips',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-01-07',
            image: {
              id: '1',
              version: 1,
              fileName: 'b7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b7.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      blog2Caption: 'Études de cas',
      blog2Title:
        'Jetez un œil à quelques-unes de nos excellentes œuvres avec d’excellents designs et des concepts innovants.',
      blog2Navigation: false,
      blog2SpaceBetween: 0,
      blog2BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Ligula tristique quis risus',
            category: 'Codage',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-04-14',
            image: {
              id: '1',
              version: 1,
              fileName: 'b4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b4.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'ullam id dolor elit id nibh',
            category: 'Espace de travail',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-03-29',
            image: {
              id: '1',
              version: 1,
              fileName: 'b5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b5.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Réunion',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-02-26',
            image: {
              id: '1',
              version: 1,
              fileName: 'b6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b6.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Conseils aux entreprises',
            description:
              'Mauris convallis non ligula non interdum. Gravida vulputate convallis tempus vestibulum cras imperdiet nun eu dolor.',
            date: '2022-01-07',
            image: {
              id: '1',
              version: 1,
              fileName: 'b7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b7.jpg',
            },
          },
        },
      ],
    },
  },
];
