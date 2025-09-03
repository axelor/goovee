import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio7Schema = {
  title: 'Portfolio 7',
  code: 'portfolio7',
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
      name: 'image1',
      title: 'Image 1',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image1Link',
      title: 'Image 1 Link',
      type: 'string',
    },
    {
      name: 'caption1',
      title: 'Caption 1',
      type: 'string',
    },
    {
      name: 'title1',
      title: 'Title 1',
      type: 'string',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image2Link',
      title: 'Image 2 Link',
      type: 'string',
    },
    {
      name: 'caption2',
      title: 'Caption 2',
      type: 'string',
    },
    {
      name: 'title2',
      title: 'Title 2',
      type: 'string',
    },
    {
      name: 'image3',
      title: 'Image 3',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image3Link',
      title: 'Image 3 Link',
      type: 'string',
    },
    {
      name: 'caption3',
      title: 'Caption 3',
      type: 'string',
    },
    {
      name: 'title3',
      title: 'Title 3',
      type: 'string',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio7Data = Data<typeof portfolio7Schema>;

export const portfolio7Demos: Demo<typeof portfolio7Schema>[] = [
  {
    language: 'en_US',
    data: {
      portfolio7Title: 'Check out some of our recent projects below.',
      portfolio7Description: 'We love to turn ideas into beautiful things.',
      portfolio7Image1: {
        id: '1',
        version: 1,
        fileName: 'rp1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp1.jpg',
      },
      portfolio7Image1Link: '#',
      portfolio7Caption1: 'Stationary',
      portfolio7Title1: 'Ipsum Ultricies Cursus',
      portfolio7Image2: {
        id: '1',
        version: 1,
        fileName: 'rp2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp2.jpg',
      },
      portfolio7Image2Link: '#',
      portfolio7Caption2: 'Invitation',
      portfolio7Title2: 'Mollis Ipsum Mattis',
      portfolio7Image3: {
        id: '1',
        version: 1,
        fileName: 'rp3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp3.jpg',
      },
      portfolio7Image3Link: '#',
      portfolio7Caption3: 'Notebook',
      portfolio7Title3: 'Magna Tristique Inceptos',
    },
  },
  {
    language: 'fr_FR',
    data: {
      portfolio7Title:
        'Découvrez quelques-uns de nos projets récents ci-dessous.',
      portfolio7Description:
        'Nous aimons transformer les idées en de belles choses.',
      portfolio7Image1: {
        id: '1',
        version: 1,
        fileName: 'rp1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp1.jpg',
      },
      portfolio7Image1Link: '#',
      portfolio7Caption1: 'Papeterie',
      portfolio7Title1: 'Ipsum Ultricies Cursus',
      portfolio7Image2: {
        id: '1',
        version: 1,
        fileName: 'rp2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp2.jpg',
      },
      portfolio7Image2Link: '#',
      portfolio7Caption2: 'Invitation',
      portfolio7Title2: 'Mollis Ipsum Mattis',
      portfolio7Image3: {
        id: '1',
        version: 1,
        fileName: 'rp3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp3.jpg',
      },
      portfolio7Image3Link: '#',
      portfolio7Caption3: 'Carnet',
      portfolio7Title3: 'Magna Tristique Inceptos',
    },
  },
];
