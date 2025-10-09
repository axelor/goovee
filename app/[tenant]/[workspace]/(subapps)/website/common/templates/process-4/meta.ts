import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {solidIconsSelection} from '../meta-selections';

export const process4Schema = {
  title: 'Process 4',
  code: 'process4',
  type: Template.block,
  fields: [
    {
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
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
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process4Processes',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 pt-md-16 pt-lg-0 pb-md-16',
    },
  ],
  models: [
    {
      name: 'Process4Processes',
      title: 'Processes',
      fields: [
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Process4Data = Data<typeof process4Schema>;

export const process4Demos: Demo<typeof process4Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-5',
    sequence: 3,
    data: {
      process4Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process4Caption: 'Our Process',
      process4Description:
        'Learn the whole thing you require to know in designing a company strategy method.',
      process4Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: '1. Secured Transactions',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: '2. Budget Planning',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: '3. Up to Date',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-5',
    sequence: 3,
    data: {
      process4Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process4Caption: 'Notre processus',
      process4Description:
        'Apprenez tout ce que vous devez savoir sur la conception d’une méthode de stratégie d’entreprise.',
      process4Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: '1. Transactions sécurisées',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: '2. Planification budgétaire',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: '3. À jour',
            subtitle: 'Etiam porta malesuada magna mollis euismod sem.',
          },
        },
      ],
    },
  },
];
