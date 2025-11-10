import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const process10Code = 'process10';

export const process10Schema = {
  title: 'Process 10',
  code: process10Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process10Processes',
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
      defaultValue: 'container mb-14 mb-md-17',
    },
  ],
  models: [
    {
      name: 'Process10Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'No',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Process10Data = Data<typeof process10Schema>;

export const process10Demos: Demo<typeof process10Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-12',
    sequence: 3,
    data: {
      process10Title: 'Our three process steps on creating awesome projects.',
      process10Image: {
        attrs: {
          alt: 'Our process',
          width: 600,
          height: 428,
          image: {
            fileName: 'i8.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i8.png',
          },
        },
      },
      process10Processes: [
        {
          attrs: {
            no: '1',
            title: 'Personalized service',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
          },
        },
        {
          attrs: {
            no: '2',
            title: 'Competitive pricing',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
          },
        },
        {
          attrs: {
            no: '3',
            title: 'Timely delivery',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-12',
    sequence: 3,
    data: {
      process10Title:
        'Nos trois étapes de processus pour créer des projets impressionnants.',
      process10Image: {
        attrs: {
          alt: 'Notre processus',
          width: 600,
          height: 428,
          image: {
            fileName: 'i8.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i8.png',
          },
        },
      },
      process10Processes: [
        {
          attrs: {
            no: '1',
            title: 'Service personnalisé',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          attrs: {
            no: '2',
            title: 'Prix compétitifs',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          attrs: {
            no: '3',
            title: 'Livraison à temps',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
      ],
    },
  },
];
