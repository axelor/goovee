import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratings} from '../../constants/ratings';

export const testimonial9Schema = {
  title: 'Testimonial 9',
  code: 'testimonial9',
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
      selection: ratings,
    },
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Testimonial9Data = Data<typeof testimonial9Schema>;

export const testimonial9Demos: Demo<typeof testimonial9Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial9Name: 'Ethan Johnson',
      testimonial9Designation: 'MARKETING MANAGER',
      testimonial9Review:
        'I wanted to share my positive experience working with your team. From start to finish, the process was smooth and efficient, and the end result exceeded my expectations. Your team’s attention to detail, creativity, and responsiveness was impressive. I appreciate how you took the time to understand my needs.',
      testimonial9Rating: 5,
      testimonial9Image: {
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
    data: {
      testimonial9Name: 'Ethan Johnson',
      testimonial9Designation: 'RESPONSABLE MARKETING',
      testimonial9Review:
        'Je voulais partager mon expérience positive de travail avec votre équipe. Du début à la fin, le processus s’est déroulé sans heurts et de manière efficace, et le résultat final a dépassé mes attentes. L’attention portée aux détails, la créativité et la réactivité de votre équipe ont été impressionnantes. J’apprécie que vous ayez pris le temps de comprendre mes besoins.',
      testimonial9Rating: 5,
      testimonial9Image: {
        id: '1',
        version: 1,
        fileName: 'co4.png',
        fileType: 'image/png',
        filePath: '/img/photos/co4.png',
      },
    },
  },
];
