import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const about4Schema = {
  title: 'About 4',
  code: 'about4',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'tileImage1',
      title: 'Tile Image 1',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage3',
      title: 'Tile Image 3',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage4',
      title: 'Tile Image 4',
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
      defaultValue: 'container pb-14 pb-md-18',
    },
  ],
  models: [accordionModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About4Data = Data<typeof about4Schema>;

export const about4Demos: Demo<typeof about4Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-4',
    sequence: 4,
    data: {
      about4Title:
        'There are some of the factors why the people we serve find us.',
      about4TileImage1: {
        id: '1',
        version: 1,
        fileName: 'g1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g1.jpg',
      },
      about4TileImage2: {
        id: '2',
        version: 1,
        fileName: 'g2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g2.jpg',
      },
      about4TileImage3: {
        id: '3',
        version: 1,
        fileName: 'g3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g3.jpg',
      },
      about4TileImage4: {
        id: '4',
        version: 1,
        fileName: 'g4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g4.jpg',
      },
      about4Accordions: [
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
    page: 'demo-4',
    sequence: 4,
    data: {
      about4Title:
        'Voici quelques-uns des facteurs pour lesquels les personnes que nous servons nous trouvent.',
      about4TileImage1: {
        id: '1',
        version: 1,
        fileName: 'g1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g1.jpg',
      },
      about4TileImage2: {
        id: '2',
        version: 1,
        fileName: 'g2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g2.jpg',
      },
      about4TileImage3: {
        id: '3',
        version: 1,
        fileName: 'g3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g3.jpg',
      },
      about4TileImage4: {
        id: '4',
        version: 1,
        fileName: 'g4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g4.jpg',
      },
      about4Accordions: [
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
