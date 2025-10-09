import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const about18Schema = {
  title: 'About 18',
  code: 'about18',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'heading1',
      title: 'Heading 1',
      type: 'string',
    },
    {
      name: 'heading2',
      title: 'Heading 2',
      type: 'string',
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
      name: 'dataValue',
      title: 'Data Value',
      type: 'integer',
    },
    {
      name: 'aboutList',
      title: 'About List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
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
      defaultValue: 'container pb-14 pb-md-18',
    },
  ],
  models: [bulletListModel, imageModel],
} as const satisfies TemplateSchema;

export type About18Data = Data<typeof about18Schema>;

export const about18Demos: Demo<typeof about18Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-18',
    sequence: 4,
    data: {
      about18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'What makes us different',
          width: 583,
          height: 550,
          image: {
            id: '1',
            version: 1,
            fileName: 'about27.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about27.jpg',
          },
        },
      },
      about18Caption: 'What Makes Us Different?',
      about18Title:
        'We take the stress out of using it so that you can be full charge.',
      about18Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Goals and interact with one another in a shared location or virtual space.',
      about18Heading1: 'Happy Clients',
      about18Heading2: 'Time Saved',
      about18CountUp: 15,
      about18Suffix: 'K+',
      about18DataValue: 80,
      about18AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'Customers may choose company quality product.'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'Customers may choose company quality product.'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'Customers may choose company quality product.'},
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-18',
    sequence: 4,
    data: {
      about18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Ce qui nous rend différents',
          width: 583,
          height: 550,
          image: {
            id: '1',
            version: 1,
            fileName: 'about27.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about27.jpg',
          },
        },
      },
      about18Caption: 'Qu’est-ce qui nous rend différents ?',
      about18Title:
        'Nous éliminons le stress lié à son utilisation afin que vous puissiez être pleinement responsable.',
      about18Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les objectifs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel.',
      about18Heading1: 'Clients heureux',
      about18Heading2: 'Temps gagné',
      about18CountUp: 15,
      about18Suffix: 'K+',
      about18DataValue: 80,
      about18AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité d’entreprise.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité d’entreprise.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité d’entreprise.',
              },
            },
          ],
        },
      },
    },
  },
];
