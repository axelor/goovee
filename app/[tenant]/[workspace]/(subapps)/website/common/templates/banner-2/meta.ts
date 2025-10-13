import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const banner2Code = 'banner2';

export const banner2Schema = {
  title: 'Banner 2',
  code: banner2Code,
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
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
      defaultValue: 'wrapper mobile image-wrapper text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-16 py-md-19 text-center position-relative',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Banner2Data = Data<typeof banner2Schema>;

export const banner2Demos: Demo<typeof banner2Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-24',
    sequence: 3,
    data: {
      banner2Heading: 'I shoot with imagination, philosophy, and emotion.',
      banner2Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Imagination, philosophy, and emotion in photography',
          width: 1440,
          height: 438,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg34.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg34.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-24',
    sequence: 3,
    data: {
      banner2Heading:
        'Je photographie avec imagination, philosophie et émotion.',
      banner2Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Imagination, philosophie et émotion en photographie',
          width: 1440,
          height: 438,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg34.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg34.jpg',
          },
        },
      },
    },
  },
];
