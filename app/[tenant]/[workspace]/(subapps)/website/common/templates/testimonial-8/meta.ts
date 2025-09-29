import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial8Schema = {
  title: 'Testimonial 8',
  code: 'testimonial8',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial8Testimonial',
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
      defaultValue: 'container pb-8 pb-lg-10',
    },
  ],
  models: [
    {
      name: 'Testimonial8Testimonial',
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

export type Testimonial8Data = Data<typeof testimonial8Schema>;

export const testimonial8Demos: Demo<typeof testimonial8Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-7',
    sequence: 7,
    data: {
      testimonial8Caption: 'What Our Customers Say About Us',
      testimonial8Testimonials: [
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
            rating: 5,
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
            rating: 5,
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
            rating: 4,
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
            rating: 5,
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
            rating: 5,
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
            rating: 4,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-7',
    sequence: 7,
    data: {
      testimonial8Caption: 'Ce que nos clients disent de nous',
      testimonial8Testimonials: [
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
            rating: 5,
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
            rating: 5,
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
            rating: 4,
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
            rating: 5,
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
            rating: 5,
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
            rating: 4,
          },
        },
      ],
    },
  },
];
