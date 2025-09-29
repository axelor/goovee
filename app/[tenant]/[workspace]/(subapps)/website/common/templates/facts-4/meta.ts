import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const facts4Schema = {
  title: 'Facts 4',
  code: 'facts4',
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
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts4Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-auto no-overlay bg-image bg-map text-center',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-0 pb-14 pt-md-16 pb-md-18',
    },
  ],
  models: [
    {
      name: 'Facts4Facts',
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
          name: 'value',
          title: 'Value',
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

export type Facts4Data = Data<typeof facts4Schema>;

export const facts4Demos: Demo<typeof facts4Schema>[] = [
  {
    language: 'en_US',
    page: 'others',
    sequence: 7,
    data: {
      facts4Title: 'Trust us, join 10K+ clients to grow your business.',
      facts4Caption: 'Join Our Community',
      facts4BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
      facts4Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            value: 7,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Satisfied Customers',
            value: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            value: 3,
            suffix: 'K+',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'others',
    sequence: 7,
    data: {
      facts4Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      facts4Caption: 'Rejoignez notre communauté',
      facts4BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
      facts4Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            value: 7,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients satisfaits',
            value: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            value: 3,
            suffix: 'K+',
          },
        },
      ],
    },
  },
];
