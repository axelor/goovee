import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';

export const about16Code = 'about16';

export const about16Schema = {
  title: 'About 16',
  code: about16Code,
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
      name: 'accordions',
      title: 'Accordions',
      target: 'Accordion',
      type: 'json-one-to-many',
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
  models: [accordionModel, imageModel],
} as const satisfies TemplateSchema;

export type About16Data = Data<typeof about16Schema>;

export const about16Demos: Demo<typeof about16Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-17',
    sequence: 7,
    data: {
      about16Image: {
        attrs: {
          alt: 'Valued customers',
          width: 496,
          height: 424,
          image: {
            fileName: 'about25.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about25.jpg',
          },
        },
      },
      about16Caption: 'Why Choose Us?',
      about16Title: 'We bring solutions to make life easier for our clients.',
      about16Accordions: [
        {
          attrs: {
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
            expand: true,
            heading: 'Quality of Service',
          },
        },
        {
          attrs: {
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
            heading: 'Competitive Pricing',
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-17',
    sequence: 7,
    data: {
      about16Image: {
        attrs: {
          alt: 'Clients évalués',
          width: 496,
          height: 424,
          image: {
            fileName: 'about25.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about25.jpg',
          },
        },
      },
      about16Caption: 'Pourquoi nous choisir ?',
      about16Title:
        'Nous apportons des solutions pour faciliter la vie de nos clients.',
      about16Accordions: [
        {
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            expand: true,
            heading: 'Qualité de service',
          },
        },
        {
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            heading: 'Prix compétitifs',
          },
        },
        {
          attrs: {
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
            heading: 'Service Clients',
          },
        },
      ],
    },
  },
];
