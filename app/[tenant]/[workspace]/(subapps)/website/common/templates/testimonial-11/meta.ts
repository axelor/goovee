import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial11Schema = {
  title: 'Testimonial 11',
  code: 'testimonial11',
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
      target: 'Testimonial11Testimonial',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-14 pt-md-0 mt-md-n50p mb-14 mb-lg-n6',
    },
  ],
  models: [
    {
      name: 'Testimonial11Testimonial',
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
  metaModels: [metaFileModel],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial11Data = Data<typeof testimonial11Schema>;

export const testimonial11Demos: Demo<typeof testimonial11Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-11',
    sequence: 9,
    data: {
      testimonial11Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      testimonial11SlidesPerView: 1,
      testimonial11Navigation: false,
      testimonial11Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Lukmen Wisley',
            designation: 'Ui Designer',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Marketing Specialist',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            designation: 'Sales Specialist',
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
    page: 'demo-11',
    sequence: 9,
    data: {
      testimonial11Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      testimonial11SlidesPerView: 1,
      testimonial11Navigation: false,
      testimonial11Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Lukmen Wisley',
            designation: 'Ui Designer',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Spécialiste en marketing',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            designation: 'Spécialiste des ventes',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace.',
            rating: 5,
          },
        },
      ],
    },
  },
];
