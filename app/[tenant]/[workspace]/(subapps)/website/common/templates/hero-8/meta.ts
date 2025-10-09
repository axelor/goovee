import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero8Schema = {
  title: 'Hero 8',
  code: 'hero8',
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
      defaultValue: 'wrapper  bg-light mb-13 mb-md-17',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
    {
      name: 'cardClassName',
      title: 'Card Class Name',
      type: 'string',
      defaultValue: 'card bg-soft-primary rounded-4 mt-2',
    },

    {
      name: 'cardBodyClassName',
      title: 'Card Body Class Name',
      type: 'string',
      defaultValue: 'card-body p-md-10 py-xl-11 px-xl-15',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero8Data = Data<typeof hero8Schema>;

export const hero8Demos: Demo<typeof hero8Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-8',
    sequence: 1,
    data: {
      hero8Title: 'Creating particular project ideas with experience',
      hero8Description:
        'We are an organization that concentrates on creating permanent relationships with clients.',
      hero8ButtonLabel1: 'Explore Now',
      hero8ButtonLabel2: 'Contact Us',
      hero8ButtonLink1: '#',
      hero8ButtonLink2: '#',
      hero8Image: {
        id: '1',
        version: 1,
        attrs: {
          alt: 'Business process model',
          width: 369,
          height: 471,
          image: {
            id: '1',
            version: 1,
            fileName: 'co3.png',
            fileType: 'image/png',
            filePath: '/img/photos/co3.png',
          },
        },
      },
      hero8CountUp: 20,
      hero8Suffix: 'K+',
      hero8Heading: 'Happy Clients',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-8',
    sequence: 1,
    data: {
      hero8Title: 'Créer des idées de projets particulières avec expérience',
      hero8Description:
        'Nous sommes une organisation qui se concentre sur la création de relations permanentes avec les clients.',
      hero8ButtonLabel1: 'Explorer maintenant',
      hero8ButtonLabel2: 'Contactez-nous',
      hero8ButtonLink1: '#',
      hero8ButtonLink2: '#',
      hero8Image: {
        id: '1',
        version: 1,
        attrs: {
          alt: 'Modèle de processus métier',
          width: 369,
          height: 471,
          image: {
            id: '1',
            version: 1,
            fileName: 'co3.png',
            fileType: 'image/png',
            filePath: '/img/photos/co3.png',
          },
        },
      },
      hero8CountUp: 20,
      hero8Suffix: 'K+',
      hero8Heading: 'Clients heureux',
    },
  },
];
