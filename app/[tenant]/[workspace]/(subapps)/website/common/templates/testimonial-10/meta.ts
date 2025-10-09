import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial10Schema = {
  title: 'Testimonial 10',
  code: 'testimonial10',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial10Testimonial',
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
      defaultValue: 'container py-14 py-md-17',
    },
  ],
  models: [
    {
      name: 'Testimonial10Testimonial',
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
} as const satisfies TemplateSchema;

export type Testimonial10Data = Data<typeof testimonial10Schema>;

export const testimonial10Demos: Demo<typeof testimonial10Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-9',
    sequence: 4,
    data: {
      testimonial10Caption: 'Happy Clients',
      testimonial10Description:
        'Avoid just believing us. Discover what our clients have thought about us.',
      testimonial10Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            image: {
              id: '1',
              version: 1,
              fileName: 'te1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te1.jpg',
            },
            designation: 'Financial Analyst',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            image: {
              id: '1',
              version: 1,
              fileName: 'te2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te2.jpg',
            },
            designation: 'Marketing Specialist',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient. From start to finish, the process was efficient.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            image: {
              id: '1',
              version: 1,
              fileName: 'te3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te3.jpg',
            },
            designation: 'Sales Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            image: {
              id: '1',
              version: 1,
              fileName: 'te4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te4.jpg',
            },
            designation: 'Financial Analyst',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Laura Widerski',
            image: {
              id: '1',
              version: 1,
              fileName: 'te5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te5.jpg',
            },
            designation: 'Sales Specialist',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient. From start to finish, the process was efficient.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            image: {
              id: '1',
              version: 1,
              fileName: 'te6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te6.jpg',
            },
            designation: 'Jackie Sanders',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-9',
    sequence: 4,
    data: {
      testimonial10Caption: 'Clients satisfaits',
      testimonial10Description:
        'Évitez de nous croire sur parole. Découvrez ce que nos clients ont pensé de nous.',
      testimonial10Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            image: {
              id: '1',
              version: 1,
              fileName: 'te1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te1.jpg',
            },
            designation: 'Analyste financier',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            image: {
              id: '1',
              version: 1,
              fileName: 'te2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te2.jpg',
            },
            designation: 'Spécialiste en marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace. Du début à la fin, le processus a été efficace.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            image: {
              id: '1',
              version: 1,
              fileName: 'te3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te3.jpg',
            },
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            image: {
              id: '1',
              version: 1,
              fileName: 'te4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te4.jpg',
            },
            designation: 'Analyste financier',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Laura Widerski',
            image: {
              id: '1',
              version: 1,
              fileName: 'te5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te5.jpg',
            },
            designation: 'Spécialiste des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace. Du début à la fin, le processus a été efficace.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            image: {
              id: '1',
              version: 1,
              fileName: 'te6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te6.jpg',
            },
            designation: 'Jackie Sanders',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace',
          },
        },
      ],
    },
  },
];
