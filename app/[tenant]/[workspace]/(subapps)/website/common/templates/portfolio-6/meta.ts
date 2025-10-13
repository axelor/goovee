import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio6Code = 'portfolio6';

export const portfolio6Schema = {
  title: 'Portfolio 6',
  code: portfolio6Code,
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
      type: 'json-many-to-one',
      target: 'Image',
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
      type: 'json-many-to-one',
      target: 'Image',
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
      type: 'json-many-to-one',
      target: 'Image',
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
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Portfolio6Data = Data<typeof portfolio6Schema>;

export const portfolio6Demos: Demo<typeof portfolio6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-12',
    sequence: 7,
    data: {
      portfolio6Title: 'Check out some of our recent projects below.',
      portfolio6Description: 'We love to turn ideas into beautiful things.',
      portfolio6Image1: {
        id: 'img-1',
        version: 0,
        attrs: {
          alt: 'Ipsum Ultricies Cursus',
          width: 568,
          height: 455,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp1.jpg',
          },
        },
      },
      portfolio6Image1Link: '#',
      portfolio6Caption1: 'Stationary',
      portfolio6Title1: 'Ipsum Ultricies Cursus',
      portfolio6Image2: {
        id: 'img-2',
        version: 0,
        attrs: {
          alt: 'Mollis Ipsum Mattis',
          width: 568,
          height: 531,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp2.jpg',
          },
        },
      },
      portfolio6Image2Link: '#',
      portfolio6Caption2: 'Invitation',
      portfolio6Title2: 'Mollis Ipsum Mattis',
      portfolio6Image3: {
        id: 'img-3',
        version: 0,
        attrs: {
          alt: 'Magna Tristique Inceptos',
          width: 568,
          height: 382,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp3.jpg',
          },
        },
      },
      portfolio6Image3Link: '#',
      portfolio6Caption3: 'Notebook',
      portfolio6Title3: 'Magna Tristique Inceptos',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-12',
    sequence: 7,
    data: {
      portfolio6Title:
        'Découvrez quelques-uns de nos projets récents ci-dessous.',
      portfolio6Description:
        'Nous aimons transformer les idées en de belles choses.',
      portfolio6Image1: {
        id: 'img-1',
        version: 0,
        attrs: {
          alt: 'Ipsum Ultricies Cursus',
          width: 568,
          height: 455,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp1.jpg',
          },
        },
      },
      portfolio6Image1Link: '#',
      portfolio6Caption1: 'Papeterie',
      portfolio6Title1: 'Ipsum Ultricies Cursus',
      portfolio6Image2: {
        id: 'img-2',
        version: 0,
        attrs: {
          alt: 'Mollis Ipsum Mattis',
          width: 568,
          height: 531,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp2.jpg',
          },
        },
      },
      portfolio6Image2Link: '#',
      portfolio6Caption2: 'Invitation',
      portfolio6Title2: 'Mollis Ipsum Mattis',
      portfolio6Image3: {
        id: 'img-3',
        version: 0,
        attrs: {
          alt: 'Magna Tristique Inceptos',
          width: 568,
          height: 382,
          image: {
            id: '1',
            version: 1,
            fileName: 'rp3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/rp3.jpg',
          },
        },
      },
      portfolio6Image3Link: '#',
      portfolio6Caption3: 'Carnet',
      portfolio6Title3: 'Magna Tristique Inceptos',
    },
  },
];
