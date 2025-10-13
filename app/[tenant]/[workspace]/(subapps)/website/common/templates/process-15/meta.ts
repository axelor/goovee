import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const process15Code = 'process15';

export const process15Schema = {
  title: 'Process 15',
  code: process15Code,
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
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process15Processes',
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
      defaultValue: 'container my-14 my-md-17',
    },
  ],
  models: [
    {
      name: 'Process15Processes',
      title: 'Processes',
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
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Process15Data = Data<typeof process15Schema>;

export const process15Demos: Demo<typeof process15Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-22',
    sequence: 3,
    data: {
      process15Title:
        'We provide ideas for creating the lives of our clients easier.',
      process15Caption: 'How It Works?',
      process15Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'process',
          width: 676,
          height: 514,
          image: {
            id: '1',
            version: 1,
            fileName: 'i9.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i9.png',
          },
        },
      },
      process15Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Personalized Service',
            description:
              'We believe in getting to know our customers & understanding.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Competitive Pricing',
            description:
              'We believe in getting to know our customers & understanding.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Finalize Product',
            description:
              'We believe in getting to know our customers & understanding.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Timely Delivery',
            description:
              'We believe in getting to know our customers & understanding.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-22',
    sequence: 3,
    data: {
      process15Title:
        'Nous proposons des idées pour faciliter la vie de nos clients.',
      process15Caption: 'Comment ça marche ?',
      process15Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'processus',
          width: 676,
          height: 514,
          image: {
            id: '1',
            version: 1,
            fileName: 'i9.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i9.png',
          },
        },
      },
      process15Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Service personnalisé',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de les comprendre.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Prix compétitifs',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de les comprendre.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Finaliser le produit',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de les comprendre.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Livraison à temps',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de les comprendre.',
          },
        },
      ],
    },
  },
];
