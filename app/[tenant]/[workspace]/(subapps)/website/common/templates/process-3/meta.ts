import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const process3Schema = {
  title: 'Process 3',
  code: 'process3',
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
      name: 'description',
      title: 'Description',
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
      target: 'Process3Processes',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-16 mb-md-18',
    },
  ],
  models: [
    {
      name: 'Process3Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'Number',
          type: 'string',
          required: true,
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Process3Data = Data<typeof process3Schema>;

export const process3Demos: Demo<typeof process3Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-3',
    sequence: 3,
    data: {
      process3Title: 'Our Working Process',
      process3Caption: 'How It Works?',
      process3Description:
        'Find out why our happy customers choose us by following these steps',
      process3Image: {
        id: '1',
        version: 1,
        fileName: 'about7.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about7.jpg',
      },
      process3Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '1',
            title: 'Personalized service',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '2',
            title: 'Competitive pricing',
            subtitle:
              'We believe in getting to know our customers and understanding their unique.',
          },
        },
        {
          id: '3',
          version: 0,
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
    page: 'demo-3',
    sequence: 3,
    data: {
      process3Title: 'Notre processus de travail',
      process3Caption: 'Comment ça marche ?',
      process3Description:
        'Découvrez pourquoi nos clients satisfaits nous choisissent en suivant ces étapes',
      process3Image: {
        id: '1',
        version: 1,
        fileName: 'about7.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about7.jpg',
      },
      process3Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '1',
            title: 'Service personnalisé',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '2',
            title: 'Prix compétitifs',
            subtitle:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          id: '3',
          version: 0,
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
