import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial3Schema = {
  title: 'Testimonial 3',
  code: 'testimonial3',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'countUp',
      title: 'Count Up',
      type: 'integer',
    },
    {
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
    },
    {
      name: 'slidesPerView',
      title: 'Slides Per View',
      type: 'integer',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial3Testimonial',
    },
  ],
  models: [
    {
      name: 'Testimonial3Testimonial',
      title: 'Testimonial',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'designation',
          title: 'Designation',
          type: 'string',
        },
        {
          name: 'review',
          title: 'Review',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Testimonial3Data = Data<typeof testimonial3Schema>;

export const testimonial3Demos: Demo<typeof testimonial3Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial3Title: 'What Our Customers Think About Us',
      testimonial3Description:
        'Read our customer reviews to see what they are saying about our services and expertise.',
      testimonial3TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa5.png',
        fileType: 'image/png',
        filePath: '/img/photos/sa5.png',
      },
      testimonial3TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa6.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa6.jpg',
      },
      testimonial3Heading: 'Satisfied Clients',
      testimonial3CountUp: 75,
      testimonial3Suffix: '%',
      testimonial3SlidesPerView: 1,
      testimonial3Navigation: false,
      testimonial3Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Sales Director',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Marketing Manager',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            designation: 'HR Manager',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Investment Planner',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      testimonial3Title: 'Ce que nos clients pensent de nous',
      testimonial3Description:
        'Lisez les avis de nos clients pour voir ce qu’ils disent de nos services et de notre expertise.',
      testimonial3TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa5.png',
        fileType: 'image/png',
        filePath: '/img/photos/sa5.png',
      },
      testimonial3TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa6.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa6.jpg',
      },
      testimonial3Heading: 'Clients satisfaits',
      testimonial3CountUp: 75,
      testimonial3Suffix: '%',
      testimonial3SlidesPerView: 1,
      testimonial3Navigation: false,
      testimonial3Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Directeur des ventes',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Responsable marketing',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            designation: 'Responsable RH',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Planificateur d’investissement',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
      ],
    },
  },
];
