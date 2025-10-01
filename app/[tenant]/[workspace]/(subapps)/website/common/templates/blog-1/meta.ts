import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const blog1Schema = {
  title: 'Blog 1',
  code: 'blog1',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'blogList',
      title: 'Blog List',
      type: 'json-one-to-many',
      target: 'Blog1BlogList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled upper-end',
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
      name: 'Blog1BlogList',
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

export type Blog1Data = Data<typeof blog1Schema>;

export const blog1Demos: Demo<typeof blog1Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-3',
    sequence: 6,
    data: {
      blog1Caption: 'Case Studies',
      blog1Title:
        'Explore our impressive portfolio of projects, <br /> featuring innovative concepts and exceptional design.',
      blog1BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Excellent customer service',
            category: 'Coding',
            date: '14 Apr 2022',
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
            title: 'Excellent customer service',
            category: 'Workspace',
            date: '29 Mar 2022',
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
            title: 'Excellent customer service',
            category: 'Meeting',
            date: '26 Feb 2022',
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
            title: 'Excellent customer service',
            category: 'Business Tips',
            date: '7 Jan 2022',
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
    page: 'demo-3',
    sequence: 6,
    data: {
      blog1Caption: 'Études de cas',
      blog1Title:
        'Découvrez notre impressionnant portefeuille de projets, <br /> présentant des concepts innovants et un design exceptionnel.',
      blog1BlogList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Excellent service client',
            category: 'Codage',
            date: '14 avr. 2022',
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
            title: 'Excellent service client',
            category: 'Espace de travail',
            date: '29 mars 2022',
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
            title: 'Excellent service client',
            category: 'Réunion',
            date: '26 févr. 2022',
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
            title: 'Excellent service client',
            category: 'Conseils aux entreprises',
            date: '7 janv. 2022',
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
