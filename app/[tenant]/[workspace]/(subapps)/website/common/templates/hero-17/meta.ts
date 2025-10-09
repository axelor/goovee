import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero17Schema = {
  title: 'Hero 17',
  code: 'hero17',
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
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-12 pt-md-16 text-center',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero17Data = Data<typeof hero17Schema>;

export const hero17Demos: Demo<typeof hero17Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 1,
    data: {
      hero17Title: 'We provide quick solutions for your company.',
      hero17Caption: 'Hello! This is Lighthouse',
      hero17ButtonLabel1: 'Explore Now',
      hero17ButtonLabel2: 'Contact Us',
      hero17ButtonLink1: '#',
      hero17ButtonLink2: '#',
      hero17Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Quick solutions',
          width: 1440,
          height: 710,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg11.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg11.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-17',
    sequence: 1,
    data: {
      hero17Title:
        'Nous apportons des solutions rapides pour votre entreprise.',
      hero17Caption: 'Bonjour ! C’est Lighthouse',
      hero17ButtonLabel1: 'Explorer maintenant',
      hero17ButtonLabel2: 'Contactez-nous',
      hero17ButtonLink1: '#',
      hero17ButtonLink2: '#',
      hero17Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Solutions rapides',
          width: 1440,
          height: 710,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg11.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg11.png',
          },
        },
      },
    },
  },
];
