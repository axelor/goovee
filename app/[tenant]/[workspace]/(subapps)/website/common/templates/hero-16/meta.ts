import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero16Schema = {
  title: 'Hero 16',
  code: 'hero16',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'countUp',
      title: 'Count Up',
      type: 'integer',
    },
    {
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero16Data = Data<typeof hero16Schema>;

export const hero16Demos: Demo<typeof hero16Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero16Title: 'I’m a Software Engineer & UX Designer.',
      hero16Description:
        "Hello! I'm Marry, a New York-based freelance software engineer, and UX designer. I'm highly enthusiastic about the job I do.",
      hero16ButtonLabel1: 'See My Works',
      hero16ButtonLabel2: 'Contact Me',
      hero16ButtonLink1: '#',
      hero16ButtonLink2: '#',
      hero16Image: {
        id: '1',
        version: 1,
        fileName: 'about17.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about17.jpg',
      },
      hero16CountUp: 250,
      hero16Suffix: '+',
      hero16Heading: 'Projects Done',
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero16Title: 'Je suis ingénieur logiciel et concepteur UX.',
      hero16Description:
        'Bonjour! Je m’appelle Marry, je suis un ingénieur logiciel indépendant basé à New York et un concepteur UX. Je suis très enthousiaste par le travail que je fais.',
      hero16ButtonLabel1: 'Voir mes œuvres',
      hero16ButtonLabel2: 'Contactez-moi',
      hero16ButtonLink1: '#',
      hero16ButtonLink2: '#',
      hero16Image: {
        id: '1',
        version: 1,
        fileName: 'about17.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about17.jpg',
      },
      hero16CountUp: 250,
      hero16Suffix: '+',
      hero16Heading: 'Projets réalisés',
    },
  },
];
