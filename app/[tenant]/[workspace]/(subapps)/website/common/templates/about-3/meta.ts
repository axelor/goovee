import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';

export const about3Code = 'about3';

export const about3Schema = {
  title: 'About 3',
  code: about3Code,
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-16 pb-md-18',
    },
  ],
  models: [accordionModel, imageModel],
} as const satisfies TemplateSchema;

export type About3Data = Data<typeof about3Schema>;

export const about3Demos: Demo<typeof about3Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-3',
    sequence: 4,
    data: {
      about3Title:
        'There are some of the factors why the people we serve find us.',
      about3Caption: 'Why Choose Us?',
      about3Image: {
        attrs: {
          alt: 'About US',
          width: 594,
          height: 568,
          image: {
            fileName: 'about9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about9.jpg',
          },
        },
      },
      about3Accordions: [
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
    page: 'demo-3',
    sequence: 4,
    data: {
      about3Title:
        'Voici quelques-uns des facteurs pour lesquels les personnes que nous servons nous trouvent.',
      about3Caption: 'Pourquoi nous choisir ?',
      about3Image: {
        attrs: {
          alt: 'About US',
          width: 594,
          height: 568,
          image: {
            fileName: 'about9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about9.jpg',
          },
        },
      },
      about3Accordions: [
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
