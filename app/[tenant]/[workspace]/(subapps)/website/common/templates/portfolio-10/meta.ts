import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio10Schema = {
  title: 'Portfolio 10',
  code: 'portfolio10',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio10PortfolioList',
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
      defaultValue: 'container mt-17',
    },
  ],
  models: [
    {
      name: 'Portfolio10PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'link',
          title: 'Link',
          type: 'string',
        },
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
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
        {
          name: 'fullImage',
          title: 'Full Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio10Data = Data<typeof portfolio10Schema>;

export const portfolio10Demos: Demo<typeof portfolio10Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-19',
    sequence: 6,
    data: {
      portfolio10Caption: 'Latest Projects',
      portfolio10Description:
        'Look out for a few of our fantastic works with outstanding designs and innovative concepts.',
      portfolio10Navigation: false,
      portfolio10PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Stationary',
            title: 'Cras Fermentum Sem',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd7.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd7-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd7-full.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Magazine, Book',
            title: 'Mollis Ipsum Mattis',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd8.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd8-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd8-full.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Packaging',
            title: 'Ipsum Ultricies Cursus',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd9.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd9-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd9-full.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Stationary, Branding',
            title: 'Inceptos Euismod Egestas',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd10.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd10-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd10-full.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Packaging',
            title: 'Ipsum Mollis Vulputate',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd11.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd11-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd11-full.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-19',
    sequence: 6,
    data: {
      portfolio10Caption: 'Derniers projets',
      portfolio10Description:
        'Découvrez quelques-unes de nos œuvres fantastiques avec des designs exceptionnels et des concepts innovants.',
      portfolio10Navigation: false,
      portfolio10PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Papeterie',
            title: 'Cras Fermentum Sem',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd7.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd7-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd7-full.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Magazine, Livre',
            title: 'Mollis Ipsum Mattis',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd8.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd8-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd8-full.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Emballage',
            title: 'Ipsum Ultricies Cursus',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd9.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd9-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd9-full.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Papeterie, Marque',
            title: 'Inceptos Euismod Egestas',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd10.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd10-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd10-full.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            link: '/single-project-1',
            category: 'Emballage',
            title: 'Ipsum Mollis Vulputate',
            image: {
              id: '1',
              version: 1,
              fileName: 'pd11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd11.jpg',
            },
            fullImage: {
              id: '1',
              version: 1,
              fileName: 'pd11-full.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd11-full.jpg',
            },
          },
        },
      ],
    },
  },
];
