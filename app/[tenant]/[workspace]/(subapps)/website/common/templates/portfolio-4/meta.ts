import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio4Schema = {
  title: 'Portfolio 4',
  code: 'portfolio4',
  type: Template.block,
  fields: [
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'figCaption',
      title: 'Fig Caption',
      type: 'string',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio4PortfolioList',
    },
  ],
  models: [
    {
      name: 'Portfolio4PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'stat',
          title: 'Stat',
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
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio4Data = Data<typeof portfolio4Schema>;

export const portfolio4Demos: Demo<typeof portfolio4Schema>[] = [
  {
    language: 'en_US',
    data: {
      portfolio4Description:
        'A few of the most touching stories I experienced and got the opportunity to photograph',
      portfolio4Pagination: false,
      portfolio4FigCaption: 'View Gallery',
      portfolio4PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Wedding',
            name: 'Tom & Jerry',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Wedding',
            name: 'Stacy & Thomas',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            stat: '7 Photos',
            category: 'Couples',
            name: 'Katherine & Jack',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Wedding',
            name: 'Jolene & William',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc4.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            stat: '6 Photos',
            category: 'Engagement',
            name: 'Jenn & Richard',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc5.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Wedding',
            name: 'Gloria & Leo',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc6.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      portfolio4Description:
        'Quelques-unes des histoires les plus touchantes que j’ai vécues et que j’ai eu l’occasion de photographier',
      portfolio4Pagination: false,
      portfolio4FigCaption: 'Voir la galerie',
      portfolio4PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Mariage',
            name: 'Tom & Jerry',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Mariage',
            name: 'Stacy & Thomas',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            stat: '7 Photos',
            category: 'Couples',
            name: 'Katherine & Jack',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Mariage',
            name: 'Jolene & William',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc4.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            stat: '6 Photos',
            category: 'Fiançailles',
            name: 'Jenn & Richard',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc5.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Mariage',
            name: 'Gloria & Leo',
            linkUrl: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'fc6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fc6.jpg',
            },
          },
        },
      ],
    },
  },
];
