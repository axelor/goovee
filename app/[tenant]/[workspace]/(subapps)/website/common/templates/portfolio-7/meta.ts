import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio7Code = 'portfolio7';

export const portfolio7Schema = {
  title: 'Portfolio 7',
  code: portfolio7Code,
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
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Portfolio7Data = Data<typeof portfolio7Schema>;

export const portfolio7Demos: Demo<typeof portfolio7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-13',
    sequence: 6,
    data: {
      portfolio7Title: 'Check out some of our recent projects below.',
      portfolio7Description: 'We love to turn ideas into beautiful things.',
      portfolio7Image1: {
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
      portfolio7Image1Link: '#',
      portfolio7Caption1: 'Stationary',
      portfolio7Title1: 'Ipsum Ultricies Cursus',
      portfolio7Image2: {
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
      portfolio7Image2Link: '#',
      portfolio7Caption2: 'Invitation',
      portfolio7Title2: 'Mollis Ipsum Mattis',
      portfolio7Image3: {
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
      portfolio7Image3Link: '#',
      portfolio7Caption3: 'Notebook',
      portfolio7Title3: 'Magna Tristique Inceptos',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-13',
    sequence: 6,
    data: {
      portfolio7Title:
        'Découvrez quelques-uns de nos projets récents ci-dessous.',
      portfolio7Description:
        'Nous aimons transformer les idées en de belles choses.',
      portfolio7Image1: {
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
      portfolio7Image1Link: '#',
      portfolio7Caption1: 'Papeterie',
      portfolio7Title1: 'Ipsum Ultricies Cursus',
      portfolio7Image2: {
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
      portfolio7Image2Link: '#',
      portfolio7Caption2: 'Invitation',
      portfolio7Title2: 'Mollis Ipsum Mattis',
      portfolio7Image3: {
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
      portfolio7Image3Link: '#',
      portfolio7Caption3: 'Carnet',
      portfolio7Title3: 'Magna Tristique Inceptos',
    },
  },
];
