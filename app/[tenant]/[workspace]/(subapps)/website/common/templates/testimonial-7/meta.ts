import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const testimonial7Schema = {
  title: 'Testimonial 7',
  code: 'testimonial7',
  type: Template.block,
  fields: [
    {
      name: 'tileImage1',
      title: 'Tile Image 1',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'json-many-to-one',
      target: 'Image',
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
      defaultValue: 'container pt-14 pt-md-17 mb-14',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Testimonial7Data = Data<typeof testimonial7Schema>;

export const testimonial7Demos: Demo<typeof testimonial7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-5',
    sequence: 4,
    data: {
      testimonial7TileImage1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Testimonial',
          width: 325,
          height: 325,
          image: {
            id: '1',
            version: 1,
            fileName: 'g5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g5.jpg',
          },
        },
      },
      testimonial7TileImage2: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Testimonial',
          width: 324,
          height: 217,
          image: {
            id: '1',
            version: 1,
            fileName: 'g6.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g6.jpg',
          },
        },
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
    site: 'fr',
    page: 'demo-5',
    sequence: 4,
    data: {
      testimonial7TileImage1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Témoignage',
          width: 325,
          height: 325,
          image: {
            id: '1',
            version: 1,
            fileName: 'g5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g5.jpg',
          },
        },
      },
      testimonial7TileImage2: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Témoignage',
          width: 324,
          height: 217,
          image: {
            id: '1',
            version: 1,
            fileName: 'g6.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g6.jpg',
          },
        },
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
