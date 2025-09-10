import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, bulletPointModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const service15Schema = {
  title: 'Service 15',
  code: 'service15',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-many-to-one',
      target: 'BulletList',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [bulletListModel, bulletPointModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service15Data = Data<typeof service15Schema>;

export const service15Demos: Demo<typeof service15Schema>[] = [
  {
    language: 'en_US',
    data: {
      service15Title:
        'We offer services to help control money in efficient way possible.',
      service15Caption: 'Our Solutions',
      service15Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space.',
      service15Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
      },
      service15Services: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList',
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
            {
              id: '4',
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
    data: {
      service15Title:
        'Nous offrons des services pour aider à contrôler l’argent de la manière la plus efficace possible.',
      service15Caption: 'Nos solutions',
      service15Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et qui interagissent les unes avec les autres dans un lieu ou un espace virtuel partagé.',
      service15Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
      },
      service15Services: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité de l’entreprise.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité de l’entreprise.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité de l’entreprise.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title:
                  'Les clients peuvent choisir un produit de qualité de l’entreprise.',
              },
            },
          ],
        },
      },
    },
  },
];
