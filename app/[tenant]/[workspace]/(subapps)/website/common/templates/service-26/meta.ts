import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service26Schema = {
  title: 'Service 26',
  code: 'service26',
  type: Template.block,
  fields: [
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service26Service',
    },
  ],
  models: [
    {
      name: 'Service26Service',
      title: 'Service',
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
          name: 'url',
          title: 'Url',
          type: 'string',
        },
        {
          name: 'figcaption',
          title: 'Figcaption',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service26Data = Data<typeof service26Schema>;

export const service26Demos: Demo<typeof service26Schema>[] = [
  {
    language: 'en_US',
    data: {
      service26Description:
        'I adore photographing brides and individuals there are so many emotions to capture.',
      service26Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Wedding',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs1.jpg',
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Couples',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs2.jpg',
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Engagement',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs3.jpg',
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service26Description:
        'J’adore photographier les mariées et les personnes, il y a tellement d’émotions à capturer.',
      service26Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Mariage',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs1.jpg',
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Couples',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs2.jpg',
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Fiançailles',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs3.jpg',
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
      ],
    },
  },
];
