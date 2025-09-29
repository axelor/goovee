import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const testimonial13Schema = {
  title: 'Testimonial 13',
  code: 'testimonial13',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
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
      name: 'slidesPerView',
      title: 'Slides Per View',
      type: 'integer',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial13Testimonial',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-image bg-overlay bg-overlay-300 text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-17',
    },
  ],
  models: [
    {
      name: 'Testimonial13Testimonial',
      title: 'Testimonial',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'designation',
          title: 'Designation',
          type: 'string',
        },
        {
          name: 'review',
          title: 'Review',
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
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Testimonial13Data = Data<typeof testimonial13Schema>;

export const testimonial13Demos: Demo<typeof testimonial13Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-13',
    sequence: 5,
    data: {
      testimonial13Caption: 'Happy Customers',
      testimonial13Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      testimonial13SlidesPerView: 1,
      testimonial13Navigation: false,
      testimonial13Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Toris Oklee',
            image: {
              id: '1',
              version: 1,
              fileName: 'te1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te1.jpg',
            },
            designation: 'Marketing Manager',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            image: {
              id: '1',
              version: 1,
              fileName: 'te2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te2.jpg',
            },
            designation: 'Marketing Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            image: {
              id: '1',
              version: 1,
              fileName: 'te3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te3.jpg',
            },
            designation: 'Sales Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-13',
    sequence: 5,
    data: {
      testimonial13Caption: 'Clients satisfaits',
      testimonial13Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      testimonial13SlidesPerView: 1,
      testimonial13Navigation: false,
      testimonial13Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Toris Oklee',
            image: {
              id: '1',
              version: 1,
              fileName: 'te1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te1.jpg',
            },
            designation: 'Responsable marketing',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            image: {
              id: '1',
              version: 1,
              fileName: 'te2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te2.jpg',
            },
            designation: 'Spécialiste en marketing',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Barclay Widerski',
            image: {
              id: '1',
              version: 1,
              fileName: 'te3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/te3.jpg',
            },
            designation: 'Spécialiste des ventes',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio consectetur adipiscing dapibus.',
          },
        },
      ],
    },
  },
];
