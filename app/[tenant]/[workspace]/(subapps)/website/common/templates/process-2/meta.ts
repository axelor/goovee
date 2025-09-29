import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const process2Schema = {
  title: 'Process 2',
  code: 'process2',
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
      target: 'Process2Processes',
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
      defaultValue: 'container',
    },
  ],
  models: [
    {
      name: 'Process2Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'Number',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Process2Data = Data<typeof process2Schema>;

export const process2Demos: Demo<typeof process2Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-2',
    sequence: 4,
    data: {
      process2Title: 'Our Working Process',
      process2Caption:
        'Find out why our happy customers choose us by following these steps',
      process2Image: {
        id: '1',
        version: 1,
        fileName: 'about9.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about9.jpg',
      },
      process2Processes: [
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
    page: 'demo-2',
    sequence: 4,
    data: {
      process2Title: 'Notre processus de travail',
      process2Caption:
        'Découvrez pourquoi nos clients satisfaits nous choisissent en suivant ces étapes',
      process2Image: {
        id: '1',
        version: 1,
        fileName: 'about9.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about9.jpg',
      },
      process2Processes: [
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
