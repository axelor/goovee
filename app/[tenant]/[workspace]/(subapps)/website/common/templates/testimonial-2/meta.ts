import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const testimonial2Code = 'testimonial2';

export const testimonial2Schema = {
  title: 'Testimonial 2',
  code: testimonial2Code,
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
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial2Testimonial',
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
      defaultValue:
        'container position-relative pt-16 pt-md-18 mt-n18 mt-md-n23 mb-16 mb-md-18',
    },
  ],
  models: [
    {
      name: 'Testimonial2Testimonial',
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
          visibleInGrid: true,
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

export type Testimonial2Data = Data<typeof testimonial2Schema>;

export const testimonial2Demos: Demo<typeof testimonial2Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-3',
    sequence: 8,
    data: {
      testimonial2Image: {
        attrs: {
          alt: 'Testimonial',
          width: 598,
          height: 432,
          image: {
            fileName: 'tm1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm1.jpg',
          },
        },
      },
      testimonial2Testimonials: [
        {
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Sales Director',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Marketing Manager',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            designation: 'HR Manager',
            review: `I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.`,
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-3',
    sequence: 8,
    data: {
      testimonial2Image: {
        attrs: {
          alt: 'Témoignage',
          width: 598,
          height: 432,
          image: {
            fileName: 'tm1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm1.jpg',
          },
        },
      },
      testimonial2Testimonials: [
        {
          attrs: {
            name: 'Ethan Johnson',
            designation: 'Directeur des ventes',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            designation: 'Responsable marketing',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            designation: 'Responsable RH',
            review: `Je voulais partager mon expérience positive en travaillant avec votre équipe. Du début à la fin, le processus a été fluide et efficace.`,
          },
        },
        {
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
