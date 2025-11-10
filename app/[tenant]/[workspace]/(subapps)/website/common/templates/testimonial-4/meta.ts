import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial4Code = 'testimonial4';

export const testimonial4Schema = {
  title: 'Testimonial 4',
  code: testimonial4Code,
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
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial4Data = Data<typeof testimonial4Schema>;

export const testimonial4Demos: Demo<typeof testimonial4Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
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
          attrs: {
            name: 'Ethan Johnson',
            image: {
              attrs: {
                alt: 'Ethan Johnson',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te7.jpg',
                },
              },
            },
            designation: 'Sales Director',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            image: {
              attrs: {
                alt: 'Gabriel Rodriguez',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te8.jpg',
                },
              },
            },
            designation: 'Marketing Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            image: {
              attrs: {
                alt: 'Samuel Patel',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te9.jpg',
                },
              },
            },
            designation: 'HR Manager',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 4,
          },
        },
        {
          attrs: {
            name: 'Jackie Sanders',
            image: {
              attrs: {
                alt: 'Jackie Sanders',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te10.jpg',
                },
              },
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
    site: 'lighthouse-fr',
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
          attrs: {
            name: 'Ethan Johnson',
            image: {
              attrs: {
                alt: 'Ethan Johnson',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te7.jpg',
                },
              },
            },
            designation: 'Directeur des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Gabriel Rodriguez',
            image: {
              attrs: {
                alt: 'Gabriel Rodriguez',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te8.jpg',
                },
              },
            },
            designation: 'Responsable marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Samuel Patel',
            image: {
              attrs: {
                alt: 'Samuel Patel',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te9.jpg',
                },
              },
            },
            designation: 'Responsable RH',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 4,
          },
        },
        {
          attrs: {
            name: 'Jackie Sanders',
            image: {
              attrs: {
                alt: 'Jackie Sanders',
                width: 300,
                height: 300,
                image: {
                  fileName: 'te10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/te10.jpg',
                },
              },
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
