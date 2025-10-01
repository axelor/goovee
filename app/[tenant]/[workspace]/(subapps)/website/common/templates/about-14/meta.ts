import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {accordionModel} from '../json-models';

export const about14Schema = {
  title: 'About 14',
  code: 'about14',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'accordions',
      title: 'Accordions',
      target: 'Accordion',
      type: 'json-one-to-many',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
    },
  ],
  models: [accordionModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About14Data = Data<typeof about14Schema>;

export const about14Demos: Demo<typeof about14Schema>[] = [
  {
    language: 'en_US',
    data: {
      about14Image: {
        id: '1',
        version: 1,
        fileName: 'i2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i2.png',
      },
      about14Title: 'Few reasons why our valued customers choose us.',
      about14Accordions: [
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
      about14Image: {
        id: '1',
        version: 1,
        fileName: 'i2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i2.png',
      },
      about14Title:
        'Quelques raisons pour lesquelles nos précieux clients nous choisissent.',
      about14Accordions: [
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
