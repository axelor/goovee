import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const about7Schema = {
  title: 'About 7',
  code: 'about7',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'leadParagraph',
      title: 'Lead Paragraph',
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

export type About7Data = Data<typeof about7Schema>;

export const about7Demos: Demo<typeof about7Schema>[] = [
  {
    language: 'en_US',
    data: {
      about7Title: 'Discover the Benefits of Choosing Us',
      about7LeadParagraph:
        'We are committed to building lasting connections with our clients.',
      about7Image: {
        id: '1',
        version: 1,
        fileName: 'i17.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i17.png',
      },
      about7Accordions: [
        {
          id: '1',
          version: 0,
          attrs: {
            expand: true,
            heading: 'Quality of Service',
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            expand: false,
            heading: 'Competitive Pricing',
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            expand: false,
            heading: 'Customer Service',
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      about7Title: 'Découvrez les avantages de nous choisir',
      about7LeadParagraph:
        'Nous nous engageons à établir des liens durables avec nos clients.',
      about7Image: {
        id: '1',
        version: 1,
        fileName: 'i17.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i17.png',
      },
      about7Accordions: [
        {
          id: '1',
          version: 0,
          attrs: {
            expand: true,
            heading: 'Qualité de service',
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            expand: false,
            heading: 'Prix compétitifs',
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            expand: false,
            heading: 'Service Clients',
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
          },
        },
      ],
    },
  },
];
