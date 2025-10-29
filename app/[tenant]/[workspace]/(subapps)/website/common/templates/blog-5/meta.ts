import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const blog5Code = 'blog5';

export const blog5Schema = {
  title: 'Blog 5',
  code: blog5Code,
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary overflow-hidden',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
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
          name: 'titleLink',
          title: 'Title Link',
          type: 'string',
        },
        {
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'comments',
          title: 'Comments',
          type: 'string',
        },
        {
          name: 'commentsLink',
          title: 'Comments Link',
          type: 'string',
        },
        {
          name: 'createdAt',
          title: 'Created At',
          type: 'date',
        },
        {
          name: 'author',
          title: 'Author',
          type: 'string',
        },
        {
          name: 'authorLink',
          title: 'Author Link',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
        {
          name: 'imageLink',
          title: 'Image Link',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Blog5Data = Data<typeof blog5Schema>;

export const blog5Demos: Demo<typeof blog5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-23',
    sequence: 8,
    data: {
      blog5Title: 'These are some of the popular articles from my site.',
      blog5Pagination: false,
      blog5BlogList: [
        {
          attrs: {
            title: 'Happy Married Life Belong',
            category: 'Wedding',
            comments: '4 Comments',
            createdAt: '2022-04-14',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Happy Married Life Belong',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b12.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Engagement of Lina Anna',
            category: 'Engagement',
            comments: '3 Comments',
            createdAt: '2022-03-29',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Engagement of Lina Anna',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b13.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b13.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Couples',
            comments: '6 Comments',
            createdAt: '2022-02-26',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Ultricies fusce porta elit',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b14.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b14.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Engagement',
            comments: '3 Comments',
            createdAt: '2022-01-17',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Morbi leo risus porta eget',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b15.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b15.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Nulla vitae elit libero',
            category: 'Couples',
            comments: '1 Comment',
            createdAt: '2022-01-07',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Pharetra augue elit sem',
                width: 410,
                height: 290,
                image: {
                  fileName: 'b16.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b16.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Pharetra augue elit sem',
            category: 'Wedding',
            comments: '2 Comments',
            createdAt: '2022-01-02',
            imageLink: '#',
            commentsLink: '#',
            author: 'By Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Nulla vitae elit libero',
                width: 410,
                height: 290,
                image: {
                  fileName: 'b17.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b17.jpg',
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
    page: 'demo-23',
    sequence: 8,
    data: {
      blog5Title: 'Voici quelques-uns des articles populaires de mon site.',
      blog5Pagination: false,
      blog5BlogList: [
        {
          attrs: {
            title: 'Une vie de couple heureuse',
            category: 'Mariage',
            comments: '4 Commentaires',
            createdAt: '2022-04-14',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Une vie de couple heureuse',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b12.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Fiançailles de Lina Anna',
            category: 'Fiançailles',
            comments: '3 Commentaires',
            createdAt: '2022-03-29',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Fiançailles de Lina Anna',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b13.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b13.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies fusce porta elit',
            category: 'Couples',
            comments: '6 Commentaires',
            createdAt: '2022-02-26',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Morbi leo risus porta eget',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b14.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b14.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Morbi leo risus porta eget',
            category: 'Fiançailles',
            comments: '3 Commentaires',
            createdAt: '2022-01-17',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Morbi leo risus porta eget',
                width: 380,
                height: 269,
                image: {
                  fileName: 'b15.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b15.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Nulla vitae elit libero',
            category: 'Couples',
            comments: '1 Commentaire',
            createdAt: '2022-01-07',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Pharetra augue elit sem',
                width: 410,
                height: 290,
                image: {
                  fileName: 'b16.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b16.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Pharetra augue elit sem',
            category: 'Mariage',
            comments: '2 Commentaires',
            createdAt: '2022-01-02',
            imageLink: '#',
            commentsLink: '#',
            author: 'par Jhon Doe',
            authorLink: '#',
            image: {
              attrs: {
                alt: 'Nulla vitae elit libero',
                width: 410,
                height: 290,
                image: {
                  fileName: 'b17.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/b17.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
