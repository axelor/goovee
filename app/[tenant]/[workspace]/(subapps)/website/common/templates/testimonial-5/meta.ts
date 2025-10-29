import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const testimonial5Code = 'testimonial5';

export const testimonial5Schema = {
  title: 'Testimonial 5',
  code: testimonial5Code,
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-16 pb-14 pb-md-0',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Testimonial5Data = Data<typeof testimonial5Schema>;

export const testimonial5Demos: Demo<typeof testimonial5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-15',
    sequence: 4,
    data: {
      testimonial5Image: {
        attrs: {
          alt: 'Testimonial',
          width: 335,
          height: 567,
          image: {
            fileName: 'co1.png',
            fileType: 'image/png',
            filePath: '/img/photos/co1.png',
          },
        },
      },
      testimonial5SlidesPerView: 1,
      testimonial5Navigation: false,
      testimonial5Testimonials: [
        {
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Sales Director',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Marketing Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            designation: 'HR Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-15',
    sequence: 4,
    data: {
      testimonial5Image: {
        attrs: {
          alt: 'Témoignage',
          width: 335,
          height: 567,
          image: {
            fileName: 'co1.png',
            fileType: 'image/png',
            filePath: '/img/photos/co1.png',
          },
        },
      },
      testimonial5SlidesPerView: 1,
      testimonial5Navigation: false,
      testimonial5Testimonials: [
        {
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Responsable marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            designation: 'Responsable RH',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
          },
        },
        {
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
