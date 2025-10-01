import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero2Schema = {
  title: 'Hero 2',
  code: 'hero2',
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
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero2Data = Data<typeof hero2Schema>;

export const hero2Demos: Demo<typeof hero2Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero2Title: 'We create solutions that make our customers lives easier.',
      hero2Description:
        'We offer solutions that cater to your business needs, regardless of your growth stage.',
      hero2ButtonLabel1: 'Explore Now',
      hero2ButtonLabel2: 'Free Trial',
      hero2ButtonLink1: '#',
      hero2ButtonLink2: '#',
      hero2Image: {
        id: '1',
        version: 1,
        fileName: 'about7.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about7.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero2Title:
        'Nous créons des solutions qui facilitent la vie de nos clients.',
      hero2Description:
        'Nous proposons des solutions qui répondent aux besoins de votre entreprise, quel que soit votre stade de croissance.',
      hero2ButtonLabel1: 'Explorer maintenant',
      hero2ButtonLabel2: 'Essai gratuit',
      hero2ButtonLink1: '#',
      hero2ButtonLink2: '#',
      hero2Image: {
        id: '1',
        version: 1,
        fileName: 'about7.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about7.jpg',
      },
    },
  },
];
