import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const testimonial18Code = 'testimonial18';

export const testimonial18Schema = {
  title: 'Testimonial 18',
  code: testimonial18Code,
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
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
      target: 'Testimonial18Testimonial',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay text-white',
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
      name: 'Testimonial18Testimonial',
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
          name: 'review',
          title: 'Review',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Testimonial18Data = Data<typeof testimonial18Schema>;

export const testimonial18Demos: Demo<typeof testimonial18Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-23',
    sequence: 3,
    data: {
      testimonial18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Testimonial background',
          width: 1440,
          height: 510,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg32.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg32.jpg',
          },
        },
      },
      testimonial18SlidesPerView: 1,
      testimonial18Navigation: false,
      testimonial18Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Selina & Tom',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient. I wanted to share my positive experience working process was smooth and efficient.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Jolene & Andrea',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient. I wanted to share my positive experience working process was smooth and efficient.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Eve & Will',
            review:
              'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient. I wanted to share my positive experience working process was smooth and efficient.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-23',
    sequence: 3,
    data: {
      testimonial18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Arrière-plan de témoignage',
          width: 1440,
          height: 510,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg32.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg32.jpg',
          },
        },
      },
      testimonial18SlidesPerView: 1,
      testimonial18Navigation: false,
      testimonial18Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Selina & Tom',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace. Je voulais partager mon expérience positive, le processus de travail a été fluide et efficace.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Jolene & Andrea',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace. Je voulais partager mon expérience positive, le processus de travail a été fluide et efficace.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Eve & Will',
            review:
              'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace. Je voulais partager mon expérience positive, le processus de travail a été fluide et efficace.',
          },
        },
      ],
    },
  },
];
