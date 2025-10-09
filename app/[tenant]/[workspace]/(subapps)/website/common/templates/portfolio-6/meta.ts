import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio6Schema = {
  title: 'Portfolio 6',
  code: 'portfolio6',
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
      name: 'image1Height',
      title: 'Image 1 Height',
      type: 'integer',
    },
    {
      name: 'image1Width',
      title: 'Image 1 Width',
      type: 'integer',
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
      name: 'image2Height',
      title: 'Image 2 Height',
      type: 'integer',
    },
    {
      name: 'image2Width',
      title: 'Image 2 Width',
      type: 'integer',
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
      name: 'image3Height',
      title: 'Image 3 Height',
      type: 'integer',
    },
    {
      name: 'image3Width',
      title: 'Image 3 Width',
      type: 'integer',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-17',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio6Data = Data<typeof portfolio6Schema>;

export const portfolio6Demos: Demo<typeof portfolio6Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-12',
    sequence: 7,
    data: {
      portfolio6Title: 'Check out some of our recent projects below.',
      portfolio6Description: 'We love to turn ideas into beautiful things.',
      portfolio6Image1: {
        id: '1',
        version: 1,
        fileName: 'rp1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp1.jpg',
      },
      portfolio6Image1Height: 455,
      portfolio6Image1Width: 568,
      portfolio6Image1Link: '#',
      portfolio6Caption1: 'Stationary',
      portfolio6Title1: 'Ipsum Ultricies Cursus',
      portfolio6Image2: {
        id: '1',
        version: 1,
        fileName: 'rp2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp2.jpg',
      },
      portfolio6Image2Height: 531,
      portfolio6Image2Width: 568,
      portfolio6Image2Link: '#',
      portfolio6Caption2: 'Invitation',
      portfolio6Title2: 'Mollis Ipsum Mattis',
      portfolio6Image3: {
        id: '1',
        version: 1,
        fileName: 'rp3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp3.jpg',
      },
      portfolio6Image3Height: 382,
      portfolio6Image3Width: 568,
      portfolio6Image3Link: '#',
      portfolio6Caption3: 'Notebook',
      portfolio6Title3: 'Magna Tristique Inceptos',
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-12',
    sequence: 7,
    data: {
      portfolio6Title:
        'Découvrez quelques-uns de nos projets récents ci-dessous.',
      portfolio6Description:
        'Nous aimons transformer les idées en de belles choses.',
      portfolio6Image1: {
        id: '1',
        version: 1,
        fileName: 'rp1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp1.jpg',
      },
      portfolio6Image1Height: 455,
      portfolio6Image1Width: 568,
      portfolio6Image1Link: '#',
      portfolio6Caption1: 'Papeterie',
      portfolio6Title1: 'Ipsum Ultricies Cursus',
      portfolio6Image2: {
        id: '1',
        version: 1,
        fileName: 'rp2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp2.jpg',
      },
      portfolio6Image2Height: 531,
      portfolio6Image2Width: 568,
      portfolio6Image2Link: '#',
      portfolio6Caption2: 'Invitation',
      portfolio6Title2: 'Mollis Ipsum Mattis',
      portfolio6Image3: {
        id: '1',
        version: 1,
        fileName: 'rp3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/rp3.jpg',
      },
      portfolio6Image3Height: 382,
      portfolio6Image3Width: 568,
      portfolio6Image3Link: '#',
      portfolio6Caption3: 'Carnet',
      portfolio6Title3: 'Magna Tristique Inceptos',
    },
  },
];
