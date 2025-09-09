import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial7Schema = {
  title: 'Testimonial 7',
  code: 'testimonial7',
  type: Template.block,
  fields: [
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
      target: 'Testimonial7Testimonial',
    },
  ],
  models: [
    {
      name: 'Testimonial7Testimonial',
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

export type Testimonial7Data = Data<typeof testimonial7Schema>;

export const testimonial7Demos: Demo<typeof testimonial7Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial7TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa13.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa13.jpg',
      },
      testimonial7TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa14.jpg',
      },
      testimonial7Heading: 'Satisfied Clients',
      testimonial7CountUp: 25,
      testimonial7Suffix: '%',
      testimonial7SlidesPerView: 1,
      testimonial7Navigation: false,
      testimonial7Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Sales Director',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Marketing Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            designation: 'HR Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Investment Planner',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      testimonial7TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa13.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa13.jpg',
      },
      testimonial7TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa14.jpg',
      },
      testimonial7Heading: 'Clients satisfaits',
      testimonial7CountUp: 25,
      testimonial7Suffix: '%',
      testimonial7SlidesPerView: 1,
      testimonial7Navigation: false,
      testimonial7Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Responsable marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            designation: 'Responsable RH',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Planificateur d’investissement',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
      ],
    },
  },
];
