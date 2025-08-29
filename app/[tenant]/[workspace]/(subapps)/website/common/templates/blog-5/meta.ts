import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const blog5Schema = {
  title: 'Blog 5',
  code: 'blog5',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'blogList',
      title: 'Blog List',
      type: 'json-one-to-many',
      target: 'Blog5BlogList',
    },
  ],
  models: [
    {
      name: 'Blog5BlogList',
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
          name: 'comments',
          title: 'Comments',
          type: 'integer',
        },
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'date',
        },
        {
          name: 'link',
          title: 'Link',
          type: 'string',
        },
        {
          name: 'figCaption',
          title: 'Fig Caption',
          type: 'string',
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

export type Blog5Data = Data<typeof blog5Schema>;

export const blog5Demos: Demo<typeof blog5Schema>[] = [
  {
    language: 'en_US',
    data: {
      blog5Title: 'These are some of the popular articles from my site.',
      blog5Pagination: false,
      blog5BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Happy Married Life Belong',
            category: 'Wedding',
            comments: 4,
            createdAt: '2022-04-14',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b12.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Engagement of Lina Anna',
            category: 'Engagement',
            comments: 3,
            createdAt: '2022-03-29',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b13.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b13.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Couples',
            comments: 6,
            createdAt: '2022-02-26',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b14.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b14.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Engagement',
            comments: 3,
            createdAt: '2022-01-17',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b15.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b15.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Nulla vitae elit libero',
            category: 'Couples',
            comments: 1,
            createdAt: '2022-01-07',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b16.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b16.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Pharetra augue elit sem',
            category: 'Wedding',
            comments: 2,
            createdAt: '2022-01-02',
            link: '#',
            figCaption: 'Read More',
            image: {
              id: '1',
              version: 1,
              fileName: 'b17.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b17.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      blog5Title: 'Voici quelques-uns des articles populaires de mon site.',
      blog5Pagination: false,
      blog5BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Une vie de couple heureuse',
            category: 'Mariage',
            comments: 4,
            createdAt: '2022-04-14',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b12.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Fiançailles de Lina Anna',
            category: 'Fiançailles',
            comments: 3,
            createdAt: '2022-03-29',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b13.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b13.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Couples',
            comments: 6,
            createdAt: '2022-02-26',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b14.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b14.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Fiançailles',
            comments: 3,
            createdAt: '2022-01-17',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b15.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b15.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Nulla vitae elit libero',
            category: 'Couples',
            comments: 1,
            createdAt: '2022-01-07',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b16.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b16.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Pharetra augue elit sem',
            category: 'Mariage',
            comments: 2,
            createdAt: '2022-01-02',
            link: '#',
            figCaption: 'Lire la suite',
            image: {
              id: '1',
              version: 1,
              fileName: 'b17.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/b17.jpg',
            },
          },
        },
      ],
    },
  },
];
