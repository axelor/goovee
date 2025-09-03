import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

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

export type Hero8Data = Data<typeof hero8Schema>;

export const hero8Demos: Demo<typeof hero8Schema>[] = [
  {
    language: 'en_US',
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
        fileName: 'co3.png',
        fileType: 'image/png',
        filePath: '/img/photos/co3.png',
      },
      hero8CountUp: 20,
      hero8Suffix: 'K+',
      hero8Heading: 'Happy Clients',
    },
  },
  {
    language: 'fr_FR',
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
        fileName: 'co3.png',
        fileType: 'image/png',
        filePath: '/img/photos/co3.png',
      },
      hero8CountUp: 20,
      hero8Suffix: 'K+',
      hero8Heading: 'Clients heureux',
    },
  },
];
