import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio11Schema = {
  title: 'Portfolio 11',
  code: 'portfolio11',
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
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
      type: 'string',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio11PortfolioList',
    },
  ],
  models: [
    {
      name: 'Portfolio11PortfolioList',
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

export type Portfolio11Data = Data<typeof portfolio11Schema>;

export const portfolio11Demos: Demo<typeof portfolio11Schema>[] = [
  {
    language: 'en_US',
    data: {
      portfolio11Caption: 'Latest Projects',
      portfolio11Description:
        'Look out for a few of our fantastic works with outstanding designs and innovative concepts.',
      portfolio11LinkTitle: 'Start a Project',
      portfolio11LinkHref: '#',
      portfolio11PortfolioList: [
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
    data: {
      portfolio11Caption: 'Derniers projets',
      portfolio11Description:
        'Découvrez quelques-unes de nos œuvres fantastiques avec des designs exceptionnels et des concepts innovants.',
      portfolio11LinkTitle: 'Démarrer un projet',
      portfolio11LinkHref: '#',
      portfolio11PortfolioList: [
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
