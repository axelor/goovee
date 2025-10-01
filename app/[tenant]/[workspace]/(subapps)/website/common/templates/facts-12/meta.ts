import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const facts12Schema = {
  title: 'Facts 12',
  code: 'facts12',
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
      target: 'Facts12Facts',
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
      name: 'Facts12Facts',
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
          name: 'countUp',
          title: 'Count Up',
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

export type Facts12Data = Data<typeof facts12Schema>;

export const facts12Demos: Demo<typeof facts12Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts12Title: 'We feel proud of our achievements.',
      facts12Caption:
        'We bring solutions to make life easier for our customers.',
      facts12Image: {
        id: '1',
        version: 1,
        fileName: 'bg22.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg22.png',
      },
      facts12Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            countUp: 10,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            countUp: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            countUp: 265,
            suffix: '+',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      facts12Title: 'Nous sommes fiers de nos réalisations.',
      facts12Caption:
        'Nous apportons des solutions pour faciliter la vie de nos clients.',
      facts12Image: {
        id: '1',
        version: 1,
        fileName: 'bg22.png',
        fileType: 'image/png',
        filePath: '/img/photos/bg22.png',
      },
      facts12Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            countUp: 10,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            countUp: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            countUp: 265,
            suffix: '+',
          },
        },
      ],
    },
  },
];
