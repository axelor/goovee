import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial2Schema = {
  title: 'Testimonial 2',
  code: 'testimonial2',
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
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial2Testimonial',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Testimonial2Data = Data<typeof testimonial2Schema>;

export const testimonial2Demos: Demo<typeof testimonial2Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial2Image: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
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
    data: {
      testimonial2Image: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
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
