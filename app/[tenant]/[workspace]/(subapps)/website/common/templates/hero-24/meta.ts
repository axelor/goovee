import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero24Schema = {
  title: 'Hero 24',
  code: 'hero24',
  type: Template.block,
  fields: [
    {
      name: 'images',
      title: 'Images',
      type: 'json-one-to-many',
      target: 'Hero24Images',
    },
  ],
  models: [
    {
      name: 'Hero24Images',
      title: 'Images',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
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

export type Hero24Data = Data<typeof hero24Schema>;

export const hero24Demos: Demo<typeof hero24Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero24Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Slide 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Slide 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Slide 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Slide 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf4.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Slide 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf5.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Slide 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf6.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero24Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Slide 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf1.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Slide 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf2.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Slide 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf3.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Slide 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf4.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Slide 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf5.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Slide 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'cf6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/cf6.jpg',
            },
          },
        },
      ],
    },
  },
];
