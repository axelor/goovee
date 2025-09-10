import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero15Schema = {
  title: 'Hero 15',
  code: 'hero15',
  type: Template.block,
  fields: [
    {
      name: 'slides',
      title: 'Slides',
      type: 'json-one-to-many',
      target: 'Hero15Slides',
    },
  ],
  models: [
    {
      name: 'Hero15Slides',
      title: 'Slides',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'buttonLabel',
          title: 'Button Label',
          type: 'string',
        },
        {
          name: 'buttonLink',
          title: 'Button Link',
          type: 'string',
        },
        {
          name: 'video',
          title: 'Video',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'binary-link',
          widgetAttrs: {'x-accept': 'video/*'},
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

export type Hero15Data = Data<typeof hero15Schema>;

export const hero15Demos: Demo<typeof hero15Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero15Slides: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'We bring solutions to make life easier.',
            description:
              'We are a creative company that focuses on long term relationships with customers.',
            buttonLabel: 'Read More',
            buttonLink: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg7.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'We are trusted by over a million customers.',
            description: 'Here a few reasons why our customers choose us.',
            video: {
              id: '1',
              version: 1,
              fileName: 'movie.mp4',
              fileType: 'video/mp4',
              filePath: '/media/movie.mp4',
            },
            image: {
              id: '1',
              version: 1,
              fileName: 'bg8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg8.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Just sit and relax.',
            description:
              'We make sure your spending is stress free so that you can have the perfect control.',
            buttonLabel: 'Contact Us',
            buttonLink: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg9.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero15Slides: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Nous apportons des solutions pour vous faciliter la vie.',
            description:
              'Nous sommes une entreprise créative qui se concentre sur les relations à long terme avec les clients.',
            buttonLabel: 'Lire la suite',
            buttonLink: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg7.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Plus d’un million de clients nous font confiance.',
            description:
              'Voici quelques raisons pour lesquelles nos clients nous choisissent.',
            video: {
              id: '1',
              version: 1,
              fileName: 'movie.mp4',
              fileType: 'video/mp4',
              filePath: '/media/movie.mp4',
            },
            image: {
              id: '1',
              version: 1,
              fileName: 'bg8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg8.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Asseyez-vous et détendez-vous.',
            description:
              'Nous nous assurons que vos dépenses sont sans stress afin que vous puissiez avoir un contrôle parfait.',
            buttonLabel: 'Contactez-nous',
            buttonLink: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'bg9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/bg9.jpg',
            },
          },
        },
      ],
    },
  },
];
