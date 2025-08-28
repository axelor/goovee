import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {accordionModel} from '../json-models';

export const about16Schema = {
  title: 'About 16',
  code: 'about16',
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
      target: 'Accordion',
      type: 'json-one-to-many',
    },
  ],
  models: [accordionModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About16Data = Data<typeof about16Schema>;

export const about16Demos: Demo<typeof about16Schema>[] = [
  {
    language: 'en_US',
    data: {
      about16Image: {
        id: '1',
        version: 1,
        fileName: 'about25.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about25.jpg',
      },
      about16Caption: 'Why Choose Us?',
      about16Title: 'We bring solutions to make life easier for our clients.',
      about16Accordions: [
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
      about16Image: {
        id: '1',
        version: 1,
        fileName: 'about25.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about25.jpg',
      },
      about16Caption: 'Pourquoi nous choisir ?',
      about16Title:
        'Nous apportons des solutions pour faciliter la vie de nos clients.',
      about16Accordions: [
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
