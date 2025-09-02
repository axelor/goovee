import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const facts14Schema = {
  title: 'Facts 14',
  code: 'facts14',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts14Facts',
    },
  ],
  models: [
    {
      name: 'Facts14Facts',
      title: 'Facts',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'amount',
          title: 'Amount',
          type: 'integer',
        },
        {
          name: 'suffix',
          title: 'Suffix',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Facts14Data = Data<typeof facts14Schema>;

export const facts14Demos: Demo<typeof facts14Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts14Title: 'Trust us, join 10K+ clients to grow your business.',
      facts14Caption: 'Join Our Community',
      facts14Image: {
        id: '1',
        version: 1,
        fileName: 'about26.png',
        fileType: 'image/png',
        filePath: '/img/photos/about26.png',
      },
      facts14Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            amount: 500,
            suffix: '+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Customers',
            amount: 2000,
            suffix: '+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Revenue Growth',
            amount: 2,
            suffix: 'x',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      facts14Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      facts14Caption: 'Rejoignez notre communauté',
      facts14Image: {
        id: '1',
        version: 1,
        fileName: 'about26.png',
        fileType: 'image/png',
        filePath: '/img/photos/about26.png',
      },
      facts14Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            amount: 500,
            suffix: '+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            amount: 2000,
            suffix: '+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Croissance des revenus',
            amount: 2,
            suffix: 'x',
          },
        },
      ],
    },
  },
];
