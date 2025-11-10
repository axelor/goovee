import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero16Code = 'hero16';

export const hero16Schema = {
  title: 'Hero 16',
  code: hero16Code,
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
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
      defaultValue: 'container pt-12 pt-md-14 pb-14 pb-md-16',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero16Data = Data<typeof hero16Schema>;

export const hero16Demos: Demo<typeof hero16Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-16',
    sequence: 1,
    data: {
      hero16Title: 'I’m a Software Engineer & UX Designer.',
      hero16Description:
        "Hello! I'm Marry, a New York-based freelance software engineer, and UX designer. I'm highly enthusiastic about the job I do.",
      hero16ButtonLabel1: 'See My Works',
      hero16ButtonLabel2: 'Contact Me',
      hero16ButtonLink1: '#',
      hero16ButtonLink2: '#',
      hero16Image: {
        attrs: {
          alt: 'Software Engineer & UX Designer',
          width: 560,
          height: 540,
          image: {
            fileName: 'about17.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about17.jpg',
          },
        },
      },
      hero16CountUp: 250,
      hero16Suffix: '+',
      hero16Heading: 'Projects Done',
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-16',
    sequence: 1,
    data: {
      hero16Title: 'Je suis ingénieur logiciel et concepteur UX.',
      hero16Description:
        'Bonjour! Je m’appelle Marry, je suis un ingénieur logiciel indépendant basé à New York et un concepteur UX. Je suis très enthousiaste par le travail que je fais.',
      hero16ButtonLabel1: 'Voir mes œuvres',
      hero16ButtonLabel2: 'Contactez-moi',
      hero16ButtonLink1: '#',
      hero16ButtonLink2: '#',
      hero16Image: {
        attrs: {
          alt: 'Ingénieur logiciel et concepteur UX',
          width: 560,
          height: 540,
          image: {
            fileName: 'about17.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about17.jpg',
          },
        },
      },
      hero16CountUp: 250,
      hero16Suffix: '+',
      hero16Heading: 'Projets réalisés',
    },
  },
];
