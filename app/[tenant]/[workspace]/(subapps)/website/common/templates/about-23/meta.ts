import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {accordionModel} from '../json-models';

export const about23Schema = {
  title: 'About 23',
  code: 'about23',
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
      defaultValue: 'container pb-15 pb-md-17',
    },
  ],
  models: [accordionModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About23Data = Data<typeof about23Schema>;

export const about23Demos: Demo<typeof about23Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-22',
    sequence: 4,
    data: {
      about23Image: {
        id: '1',
        version: 1,
        fileName: 'i12.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i12.png',
      },
      about23Caption: 'Why Choose Us?',
      about23Title: 'Discover the Benefits of Choosing Us',
      about23Accordions: [
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
    page: 'demo-22',
    sequence: 4,
    data: {
      about23Image: {
        id: '1',
        version: 1,
        fileName: 'i12.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i12.png',
      },
      about23Caption: 'Pourquoi nous choisir ?',
      about23Title: 'Découvrez les avantages de nous choisir',
      about23Accordions: [
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
