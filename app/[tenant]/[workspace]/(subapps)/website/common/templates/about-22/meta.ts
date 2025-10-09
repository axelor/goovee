import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';

export const about22Schema = {
  title: 'About 22',
  code: 'about22',
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
      defaultValue: 'wrapper bg-gradient-reverse-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-16',
    },
  ],
  models: [accordionModel, imageModel],
} as const satisfies TemplateSchema;

export type About22Data = Data<typeof about22Schema>;

export const about22Demos: Demo<typeof about22Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-21',
    sequence: 4,
    data: {
      about22Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Benefits of choosing us',
          width: 600,
          height: 428,
          image: {
            id: '1',
            version: 1,
            fileName: 'i22.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i22.png',
          },
        },
      },
      about22Caption: 'Why Choose Us?',
      about22Title: 'Discover the Benefits of Choosing Us',
      about22Accordions: [
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
    site: 'fr',
    page: 'demo-21',
    sequence: 4,
    data: {
      about22Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Avantages de nous choisir',
          width: 600,
          height: 428,
          image: {
            id: '1',
            version: 1,
            fileName: 'i22.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i22.png',
          },
        },
      },
      about22Caption: 'Pourquoi nous choisir ?',
      about22Title: 'Découvrez les avantages de nous choisir',
      about22Accordions: [
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
