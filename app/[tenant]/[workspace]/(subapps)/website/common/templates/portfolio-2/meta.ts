import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio2Schema = {
  title: 'Portfolio 2',
  code: 'portfolio2',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'slidesPerView',
      title: 'Slides Per View',
      type: 'integer',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'carouselImages',
      title: 'Carousel Images',
      type: 'json-one-to-many',
      target: 'Portfolio2CarouselImages',
    },
  ],
  models: [
    {
      name: 'Portfolio2CarouselImages',
      title: 'Carousel Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
        },
        {
          name: 'url',
          title: 'Url',
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

export type Portfolio2Data = Data<typeof portfolio2Schema>;

export const portfolio2Demos: Demo<typeof portfolio2Schema>[] = [
  {
    language: 'en_US',
    data: {
      portfolio2Caption: 'Our Recent Portfolio',
      portfolio2SlidesPerView: 2,
      portfolio2Pagination: false,
      portfolio2CarouselImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Portfolio 1',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp17.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp17.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Portfolio 2',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp18.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp18.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Portfolio 3',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp19.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp19.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Portfolio 4',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp20.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp20.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Portfolio 5',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp21.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp21.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Portfolio 6',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp22.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp22.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      portfolio2Caption: 'Notre portefeuille récent',
      portfolio2SlidesPerView: 2,
      portfolio2Pagination: false,
      portfolio2CarouselImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Portfolio 1',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp17.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp17.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Portfolio 2',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp18.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp18.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Portfolio 3',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp19.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp19.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Portfolio 4',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp20.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp20.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Portfolio 5',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp21.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp21.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Portfolio 6',
            url: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp22.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp22.jpg',
            },
          },
        },
      ],
    },
  },
];
