import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial4Schema = {
  title: 'Testimonial 4',
  code: 'testimonial4',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'spaceBetween',
      title: 'Space Between',
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
      target: 'Testimonial4Testimonial',
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
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [
    {
      name: 'Testimonial4Testimonial',
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
        {
          name: 'rating',
          title: 'Rating',
          type: 'integer',
          selection: 'ratings',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial4Data = Data<typeof testimonial4Schema>;

export const testimonial4Demos: Demo<typeof testimonial4Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-6',
    sequence: 5,
    data: {
      testimonial4Caption: 'Happy Customers',
      testimonial4Title:
        "Don't just take our word for it - take a look at what our customers have to say about us.",
      testimonial4SpaceBetween: 0,
      testimonial4Navigation: false,
      testimonial4Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            image: {
              id: '1',
              version: 1,
              fileName: 'te7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te7.jpg',
            },
            designation: 'Sales Director',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            image: {
              id: '1',
              version: 1,
              fileName: 'te8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te8.jpg',
            },
            designation: 'Marketing Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            image: {
              id: '1',
              version: 1,
              fileName: 'te9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te9.jpg',
            },
            designation: 'HR Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 4,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            image: {
              id: '1',
              version: 1,
              fileName: 'te10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te10.jpg',
            },
            designation: 'Investment Planner',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-6',
    sequence: 5,
    data: {
      testimonial4Caption: 'Clients satisfaits',
      testimonial4Title:
        'Ne nous croyez pas sur parole, jetez un œil à ce que nos clients ont à dire sur nous.',
      testimonial4SpaceBetween: 0,
      testimonial4Navigation: false,
      testimonial4Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            image: {
              id: '1',
              version: 1,
              fileName: 'te7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te7.jpg',
            },
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Gabriel Rodriguez',
            image: {
              id: '1',
              version: 1,
              fileName: 'te8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te8.jpg',
            },
            designation: 'Responsable marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Samuel Patel',
            image: {
              id: '1',
              version: 1,
              fileName: 'te9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te9.jpg',
            },
            designation: 'Responsable RH',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 4,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            image: {
              id: '1',
              version: 1,
              fileName: 'te10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te10.jpg',
            },
            designation: 'Planificateur d’investissement',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
      ],
    },
  },
];
