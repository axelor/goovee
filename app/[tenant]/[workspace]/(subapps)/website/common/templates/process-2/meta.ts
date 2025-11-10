import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const process2Code = 'process2';

export const process2Schema = {
  title: 'Process 2',
  code: process2Code,
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
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Process2Data = Data<typeof process2Schema>;

export const process2Demos: Demo<typeof process2Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-2',
    sequence: 4,
    data: {
      process2Title: 'Our Working Process',
      process2Caption:
        'Find out why our happy customers choose us by following these steps',
      process2Image: {
        attrs: {
          alt: 'how-work',
          width: 594,
          height: 568,
          image: {
            fileName: 'about9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about9.jpg',
          },
        },
      },
      process2Processes: [
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
    page: 'demo-2',
    sequence: 4,
    data: {
      process2Title: 'Notre processus de travail',
      process2Caption:
        'Découvrez pourquoi nos clients satisfaits nous choisissent en suivant ces étapes',
      process2Image: {
        attrs: {
          alt: 'comment-travailler',
          width: 594,
          height: 568,
          image: {
            fileName: 'about9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about9.jpg',
          },
        },
      },
      process2Processes: [
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
