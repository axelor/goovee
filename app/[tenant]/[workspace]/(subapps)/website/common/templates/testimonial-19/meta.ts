import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial19Schema = {
  title: 'Testimonial 19',
  code: 'testimonial19',
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'spaceBetween',
      title: 'Space Between',
      type: 'integer',
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'json-one-to-many',
      target: 'Testimonial19Testimonial',
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
  models: [
    {
      name: 'Testimonial19Testimonial',
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
          name: 'review',
          title: 'Review',
          type: 'string',
        },
        {
          name: 'designation',
          title: 'Designation',
          type: 'string',
        },
        {
          name: 'rating',
          title: 'Rating',
          type: 'integer',
          selection: 'ratings',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial19Data = Data<typeof testimonial19Schema>;

export const testimonial19Demos: Demo<typeof testimonial19Schema>[] = [
  {
    language: 'en_US',
    data: {
      testimonial19Image: {
        id: '1',
        version: 1,
        fileName: 'bg35.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg35.jpg',
      },
      testimonial19Caption: 'Happy Customers',
      testimonial19Navigation: false,
      testimonial19SpaceBetween: 0,
      testimonial19Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Financial Analyst',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Marketing Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Sales Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 4,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Investment Planner',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Laura Widerski',
            designation: 'Sales Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      testimonial19Image: {
        id: '1',
        version: 1,
        fileName: 'bg35.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg35.jpg',
      },
      testimonial19Caption: 'Clients satisfaits',
      testimonial19Navigation: false,
      testimonial19SpaceBetween: 0,
      testimonial19Testimonials: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Analyste financier',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Cory Zamora',
            designation: 'Spécialiste en marketing',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Spécialiste des ventes',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 4,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Planificateur d’investissement',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Laura Widerski',
            designation: 'Spécialiste des ventes',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
      ],
    },
  },
];
