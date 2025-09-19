import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero23Schema = {
  title: 'Hero 23',
  code: 'hero23',
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
      name: 'slideImages',
      title: 'Slide Images',
      type: 'json-one-to-many',
      target: 'Hero23SlideImages',
    },
  ],
  models: [
    {
      name: 'Hero23SlideImages',
      title: 'Slide Images',
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
        {
          name: 'thumb',
          title: 'Thumbnail Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero23Data = Data<typeof hero23Schema>;

export const hero23Demos: Demo<typeof hero23Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero23Title: 'Capturing Life with Lighthouse',
      hero23Caption: "Hello! I'm Jhon",
      hero23SlideImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Slide 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg30.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg30.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg30-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg30-th.jpg',
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
              fileName: 'bg29.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg29.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg29-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg29-th.jpg',
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
              fileName: 'bg28.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg28.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg28-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg28-th.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero23Title: 'Capturer la vie avec Lighthouse',
      hero23Caption: 'Bonjour ! Je suis Jhon',
      hero23SlideImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Slide 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg30.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg30.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg30-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg30-th.jpg',
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
              fileName: 'bg29.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg29.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg29-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg29-th.jpg',
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
              fileName: 'bg28.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg28.jpg',
            },
            thumb: {
              id: '1',
              version: 1,
              fileName: 'bg28-th.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg28-th.jpg',
            },
          },
        },
      ],
    },
  },
];
