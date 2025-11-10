import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';

export const about7Code = 'about7';

export const about7Schema = {
  title: 'About 7',
  code: about7Code,
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-15 mb-md-18',
    },
  ],
  models: [accordionModel, imageModel],
} as const satisfies TemplateSchema;

export type About7Data = Data<typeof about7Schema>;

export const about7Demos: Demo<typeof about7Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-7',
    sequence: 6,
    data: {
      about7Title: 'Discover the Benefits of Choosing Us',
      about7LeadParagraph:
        'We are committed to building lasting connections with our clients.',
      about7Image: {
        attrs: {
          alt: 'Benefits of choosing us',
          width: 673,
          height: 472,
          image: {
            fileName: 'i17.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i17.png',
          },
        },
      },
      about7Accordions: [
        {
          attrs: {
            expand: true,
            heading: 'Quality of Service',
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
          },
        },
        {
          attrs: {
            expand: false,
            heading: 'Competitive Pricing',
            body: 'Customers may choose your company because you offer high-quality products or services that meet their needs and exceed their expectations. This can lead to customer satisfaction, loyalty, and positive word-of-mouth recommendations.',
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-7',
    sequence: 6,
    data: {
      about7Title: 'Découvrez les avantages de nous choisir',
      about7LeadParagraph:
        'Nous nous engageons à établir des liens durables avec nos clients.',
      about7Image: {
        attrs: {
          alt: 'Avantages de nous choisir',
          width: 673,
          height: 472,
          image: {
            fileName: 'i17.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i17.png',
          },
        },
      },
      about7Accordions: [
        {
          attrs: {
            expand: true,
            heading: 'Qualité de service',
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
          },
        },
        {
          attrs: {
            expand: false,
            heading: 'Prix compétitifs',
            body: 'Les clients peuvent choisir votre entreprise car vous proposez des produits ou services de haute qualité qui répondent à leurs besoins et dépassent leurs attentes. Cela peut conduire à la satisfaction des clients, à la fidélité et à des recommandations positives de bouche à oreille.',
          },
        },
        {
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
