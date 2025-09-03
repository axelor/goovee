import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero4Schema = {
  title: 'Hero 4',
  code: 'hero4',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero4Data = Data<typeof hero4Schema>;

export const hero4Demos: Demo<typeof hero4Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero4Title:
        "Simple get down & calm down and we're control your requirements.",
      hero4Description:
        'Simplify your spending and take full control of your finances without any stress.',
      hero4ButtonLabel1: 'Explore Now',
      hero4ButtonLabel2: 'Contact Us',
      hero4ButtonLink1: '#',
      hero4ButtonLink2: '#',
      hero4Image: {
        id: '1',
        version: 1,
        fileName: 'about16.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about16.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero4Title: 'Calmez-vous et nous contrôlons vos besoins.',
      hero4Description:
        'Simplifiez vos dépenses et prenez le contrôle total de vos finances sans aucun stress.',
      hero4ButtonLabel1: 'Explorer maintenant',
      hero4ButtonLabel2: 'Contactez-nous',
      hero4ButtonLink1: '#',
      hero4ButtonLink2: '#',
      hero4Image: {
        id: '1',
        version: 1,
        fileName: 'about16.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about16.jpg',
      },
    },
  },
];
