import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial9Code = 'testimonial9';

export const testimonial9Schema = {
  title: 'Testimonial 9',
  code: testimonial9Code,
  type: Template.block,
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper mb-14 mb-md-18',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [imageModel],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial9Data = Data<typeof testimonial9Schema>;

export const testimonial9Demos: Demo<typeof testimonial9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-8',
    sequence: 5,
    data: {
      testimonial9Name: 'Ethan Johnson',
      testimonial9Designation: 'MARKETING MANAGER',
      testimonial9Review:
        'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient, and the end result exceeded my expectations. Your team’s attention to detail, creativity, and responsiveness was impressive. I appreciate how you took the time to understand my needs.',
      testimonial9Rating: 5,
      testimonial9Image: {
        attrs: {
          alt: 'Testimonial',
          width: 408,
          height: 601,
          image: {
            fileName: 'co4.png',
            fileType: 'image/png',
            filePath: '/img/photos/co4.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-8',
    sequence: 5,
    data: {
      testimonial9Name: 'Ethan Johnson',
      testimonial9Designation: 'RESPONSABLE MARKETING',
      testimonial9Review:
        'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace, et le résultat final a dépassé mes attentes. L’attention portée aux détails, la créativité et la réactivité de votre équipe ont été impressionnantes. J’apprécie que vous ayez pris le temps de comprendre mes besoins.',
      testimonial9Rating: 5,
      testimonial9Image: {
        attrs: {
          alt: 'Témoignage',
          width: 408,
          height: 601,
          image: {
            fileName: 'co4.png',
            fileType: 'image/png',
            filePath: '/img/photos/co4.png',
          },
        },
      },
    },
  },
];
