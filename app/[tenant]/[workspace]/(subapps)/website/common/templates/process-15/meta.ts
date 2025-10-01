import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const process15Schema = {
  title: 'Process 15',
  code: 'process15',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Process15Data = Data<typeof process15Schema>;

export const process15Demos: Demo<typeof process15Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-22',
    sequence: 3,
    data: {
      process15Title:
        'We provide ideas for creating the lives of our clients easier.',
      process15Caption: 'How It Works?',
      process15Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
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
    page: 'demo-22',
    sequence: 3,
    data: {
      process15Title:
        'Nous proposons des idées pour faciliter la vie de nos clients.',
      process15Caption: 'Comment ça marche ?',
      process15Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
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
