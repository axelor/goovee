import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const process11Code = 'process11';

export const process11Schema = {
  title: 'Process 11',
  code: process11Code,
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
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process11Processes',
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
      name: 'Process11Processes',
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

export type Process11Data = Data<typeof process11Schema>;

export const process11Demos: Demo<typeof process11Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-14',
    sequence: 7,
    data: {
      process11Title:
        "Simply relax and enjoy as we manage your company's requirements.",
      process11Caption: 'Company Strategy',
      process11Heading: 'Our Working Process',
      process11Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Our working process',
          width: 650,
          height: 525,
          image: {
            id: '1',
            version: 1,
            fileName: 'about20.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about20.jpg',
          },
        },
      },
      process11Processes: [
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
    site: 'fr',
    page: 'demo-14',
    sequence: 7,
    data: {
      process11Title:
        'Détendez-vous simplement et profitez pendant que nous gérons les exigences de votre entreprise.',
      process11Caption: 'Stratégie d’entreprise',
      process11Heading: 'Notre processus de travail',
      process11Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Notre processus de travail',
          width: 650,
          height: 525,
          image: {
            id: '1',
            version: 1,
            fileName: 'about20.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about20.jpg',
          },
        },
      },
      process11Processes: [
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
