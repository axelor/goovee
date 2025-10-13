import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';

export const about1Code = 'about1';

export const about1Schema = {
  title: 'About 1',
  code: about1Code,
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
      defaultValue: 'wrapper bg-light angled lower-start',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-15',
    },
  ],
  models: [accordionModel, imageModel],
} as const satisfies TemplateSchema;

export type About1Data = Data<typeof about1Schema>;

export const about1Demos: Demo<typeof about1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-1',
    sequence: 5,
    data: {
      about1Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Why Choose Us Image',
          width: 660,
          height: 496,
          image: {
            id: '1',
            version: 1,
            fileName: 'i6.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i6.png',
          },
        },
      },
      about1Caption: 'Why Choose Us?',
      about1Title: 'We provide solutions that make our clients live easier.',
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
    site: 'fr',
    page: 'demo-1',
    sequence: 5,
    data: {
      about1Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Why Choose Us Image',
          width: 660,
          height: 496,
          image: {
            id: '1',
            version: 1,
            fileName: 'i6.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i6.png',
          },
        },
      },
      about1Caption: 'Pourquoi nous choisir ?',
      about1Title:
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
