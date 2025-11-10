import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {ratingsSelection} from '../meta-selections';

export const testimonial16Code = 'testimonial16';

export const testimonial16Schema = {
  title: 'Testimonial 16',
  code: testimonial16Code,
  type: Template.block,
  fields: [
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
      target: 'Testimonial16Testimonial',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-16 pt-md-18 mt-n21 mt-md-n23',
    },
  ],
  models: [
    {
      name: 'Testimonial16Testimonial',
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
          name: 'rating',
          title: 'Rating',
          type: 'integer',
          selection: 'ratings',
        },
      ],
    },
    imageModel,
  ],
  selections: [ratingsSelection],
} as const satisfies TemplateSchema;

export type Testimonial16Data = Data<typeof testimonial16Schema>;

export const testimonial16Demos: Demo<typeof testimonial16Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-19',
    sequence: 5,
    data: {
      testimonial16BackgroundImage: {
        attrs: {
          alt: 'Testimonial background',
          width: 1370,
          height: 1050,
          image: {
            fileName: 'tm2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm2.jpg',
          },
        },
      },
      testimonial16SlidesPerView: 1,
      testimonial16Navigation: false,
      testimonial16Testimonials: [
        {
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Financial Analyst',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Cory Zamora',
            designation: 'Marketing Specialist',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Sales Manager',
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
    site: 'lighthouse-fr',
    page: 'demo-19',
    sequence: 5,
    data: {
      testimonial16BackgroundImage: {
        attrs: {
          alt: 'Arrière-plan de témoignage',
          width: 1370,
          height: 1050,
          image: {
            fileName: 'tm2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/tm2.jpg',
          },
        },
      },
      testimonial16SlidesPerView: 1,
      testimonial16Navigation: false,
      testimonial16Testimonials: [
        {
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Analyste financier',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Cory Zamora',
            designation: 'Spécialiste en marketing',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
        {
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Directeur des ventes',
            review:
              'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Vestibulum ligula porta felis euismod semper. Cras justo odio.',
            rating: 5,
          },
        },
      ],
    },
  },
];
