import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const about1Schema = {
  title: 'About 1',
  code: 'about1',
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
      name: 'accordions',
      title: 'Accordions',
      target: 'About1Accordion',
      type: 'json-one-to-many',
    },
  ],
  models: [
    {
      name: 'About1Accordion',
      title: 'About 1 Accordions',
      fields: [
        {
          name: 'heading',
          title: 'Heading',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'body',
          title: 'Body',
          type: 'string',
        },
        {
          name: 'expand',
          title: 'Expand',
          type: 'boolean',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About1Data = Data<typeof about1Schema>;

export const about1Demos: Demo<typeof about1Schema>[] = [
  {
    language: 'en_US',
    data: {
      about1Image: {
        id: '1',
        version: 1,
        fileName: 'i6.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i6.png',
      },
      about1Title: 'Why Choose Us?',
      about1Caption: 'We provide solutions that make our clients live easier.',
      about1Accordions: [
        {
          id: '11',
          version: 0,
          attrs: {
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
            expand: true,
            heading: 'Quality of Service',
          },
        },
        {
          id: '12',
          version: 0,
          attrs: {
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
            heading: 'Competitive Pricing',
          },
        },
        {
          id: '13',
          version: 0,
          attrs: {
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
            heading: 'Customer Service',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      about1Image: {
        id: '1',
        version: 1,
        fileName: 'i6.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i6.png',
      },
      about1Title: 'Pourquoi nous choisir ?',
      about1Caption:
        'Nous proposons des solutions qui facilitent la vie de nos clients.',
      about1Accordions: [
        {
          id: '11',
          version: 0,
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            expand: true,
            heading: 'Qualité de service',
          },
        },
        {
          id: '12',
          version: 0,
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            heading: 'Prix compétitifs',
          },
        },
        {
          id: '13',
          version: 0,
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            heading: 'Service Clients',
          },
        },
      ],
    },
  },
];
