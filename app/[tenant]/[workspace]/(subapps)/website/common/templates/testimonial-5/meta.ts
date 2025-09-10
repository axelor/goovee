import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial5Schema = {
  title: 'Testimonial 5',
  code: 'testimonial5',
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
      target: 'Testimonial5Testimonial',
    },
  ],
  models: [
    {
      name: 'Testimonial5Testimonial',
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

export type Testimonial5Data = Data<typeof testimonial5Schema>;

export const testimonial5Demos: Demo<typeof testimonial5Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial5Image: {
        id: '1',
        version: 1,
        fileName: 'co1.png',
        fileType: 'image/png',
        filePath: '/img/photos/co1.png',
      },
      testimonial5SlidesPerView: 1,
      testimonial5Navigation: false,
      testimonial5Testimonials: [
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
      testimonial5Image: {
        id: '1',
        version: 1,
        fileName: 'co1.png',
        fileType: 'image/png',
        filePath: '/img/photos/co1.png',
      },
      testimonial5SlidesPerView: 1,
      testimonial5Navigation: false,
      testimonial5Testimonials: [
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
