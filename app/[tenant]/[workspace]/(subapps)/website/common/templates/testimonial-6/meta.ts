import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial6Schema = {
  title: 'Testimonial 6',
  code: 'testimonial6',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
      defaultValue: 'container',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial6Data = Data<typeof testimonial6Schema>;

export const testimonial6Demos: Demo<typeof testimonial6Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-2',
    sequence: 8,
    data: {
      testimonial6Name: 'Ethan Johnson',
      testimonial6Designation: 'MARKETING MANAGER',
      testimonial6Review:
        'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient, and the end result exceeded my expectations. Your team’s attention to detail, creativity, and responsiveness was impressive. I appreciate how you took the time to understand my needs.',
      testimonial6Rating: 5,
      testimonial6Image: {
        id: '1',
        version: 1,
        fileName: 'co4.png',
        fileType: 'image/png',
        filePath: '/img/photos/co4.png',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-2',
    sequence: 8,
    data: {
      testimonial6Name: 'Ethan Johnson',
      testimonial6Designation: 'RESPONSABLE MARKETING',
      testimonial6Review:
        'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace, et le résultat final a dépassé mes attentes. L’attention portée aux détails, la créativité et la réactivité de votre équipe ont été impressionnantes. J’apprécie que vous ayez pris le temps de comprendre mes besoins.',
      testimonial6Rating: 5,
      testimonial6Image: {
        id: '1',
        version: 1,
        fileName: 'co4.png',
        fileType: 'image/png',
        filePath: '/img/photos/co4.png',
      },
    },
  },
];
