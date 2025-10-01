import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const testimonial15Schema = {
  title: 'Testimonial 15',
  code: 'testimonial15',
  type: Template.block,
  fields: [
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial15Testimonial',
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
      defaultValue: 'container mb-18 mt-n18',
    },
  ],
  models: [
    {
      name: 'Testimonial15Testimonial',
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
} as const satisfies TemplateSchema;

export type Testimonial15Data = Data<typeof testimonial15Schema>;

export const testimonial15Demos: Demo<typeof testimonial15Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-18',
    sequence: 6,
    data: {
      testimonial15Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Elon Tonnis',
            designation: 'Developer',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Financial Analyst',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Sales Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            designation: 'Marketing Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-18',
    sequence: 6,
    data: {
      testimonial15Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Elon Tonnis',
            designation: 'Développeur',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Analyste financier',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            designation: 'Responsable marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
      ],
    },
  },
];
