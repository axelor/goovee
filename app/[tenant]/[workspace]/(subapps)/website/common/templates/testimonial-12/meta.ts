import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {ratingsSelection} from '../meta-selections';

export const testimonial12Code = 'testimonial12';

export const testimonial12Schema = {
  title: 'Testimonial 12',
  code: testimonial12Code,
  type: Template.block,
  fields: [
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial12Testimonial',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16 mb-8 mb-md-12 mt-n18 mt-md-n21',
    },
  ],
  models: [
    {
      name: 'Testimonial12Testimonial',
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
      ],
    },
  ],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial12Data = Data<typeof testimonial12Schema>;

export const testimonial12Demos: Demo<typeof testimonial12Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-12',
    sequence: 6,
    data: {
      testimonial12Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Elon Tonnis',
            designation: 'Developer',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Tomas Anlee',
            designation: 'UX Designer',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Alina Jeen',
            designation: 'Project Analyzer',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Fuppe Dup',
            designation: 'Software Engineer',
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
    site: 'fr',
    page: 'demo-12',
    sequence: 6,
    data: {
      testimonial12Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Elon Tonnis',
            designation: 'Développeur',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Tomas Anlee',
            designation: 'Concepteur UX',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Alina Jeen',
            designation: 'Analyseur de projet',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Fuppe Dup',
            designation: 'Ingénieur logiciel',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
      ],
    },
  },
];
