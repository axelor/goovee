import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const testimonial2Schema = {
  title: 'Testimonial 2',
  code: 'testimonial2',
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
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
    site: 'en',
    page: 'demo-3',
    sequence: 8,
    data: {
      testimonial2Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Testimonial',
          width: 598,
          height: 432,
          image: {
            id: '1',
            version: 1,
            fileName: 'tm1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm1.jpg',
          },
        },
      },
      testimonial2Testimonials: [
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
    site: 'fr',
    page: 'demo-3',
    sequence: 8,
    data: {
      testimonial2Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Témoignage',
          width: 598,
          height: 432,
          image: {
            id: '1',
            version: 1,
            fileName: 'tm1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm1.jpg',
          },
        },
      },
      testimonial2Testimonials: [
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
