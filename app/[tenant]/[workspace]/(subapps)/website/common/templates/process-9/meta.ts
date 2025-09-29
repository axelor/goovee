import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {solidIconsSelection, buttonColorSelection} from '../meta-selections';

export const process9Schema = {
  title: 'Process 9',
  code: 'process9',
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
      name: 'btnColor',
      title: 'Button Color',
      type: 'string',
      selection: 'button-colors',
    },
    {
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'hideShape',
      title: 'Hide Shape',
      type: 'boolean',
    },
    {
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process9Processes',
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
      defaultValue: 'container pt-14 pt-md-17 mb-14 mb-md-19',
    },
  ],
  models: [
    {
      name: 'Process9Processes',
      title: 'Processes',
      fields: [
        {
          name: 'className',
          title: 'Class Name',
          type: 'string',
        },
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection, solidIconsSelection],
} as const satisfies TemplateSchema;

export type Process9Data = Data<typeof process9Schema>;

export const process9Demos: Demo<typeof process9Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-9',
    sequence: 5,
    data: {
      process9Title: 'Our Working Process',
      process9Caption: 'How It Works?',
      process9Description:
        'Find out why our happy customers choose us by following these steps',
      process9Image: {
        id: '1',
        version: 1,
        fileName: 'about8.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about8.jpg',
      },
      process9BtnColor: 'white',
      process9Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process9HideShape: false,
      process9Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: 'Secured Transactions',
            description:
              'Nulla vitae elit libero pharetra augue dapibus. Praesent commodo cursus.',
            className: 'd-flex flex-row mb-5',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: 'Bills Planning',
            description:
              'Vivamus sagittis lacus vel augue laoreet. Etiam porta sem malesuada magna.',
            className: 'd-flex flex-row mb-5',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: 'Always up to date',
            description:
              'Cras mattis consectetur purus sit amet. Aenean lacinia bibendum nulla sed.',
            className: 'd-flex flex-row',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-9',
    sequence: 5,
    data: {
      process9Title: 'Notre processus de travail',
      process9Caption: 'Comment ça marche ?',
      process9Description:
        'Découvrez pourquoi nos clients satisfaits nous choisissent en suivant ces étapes',
      process9Image: {
        id: '1',
        version: 1,
        fileName: 'about8.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about8.jpg',
      },
      process9BtnColor: 'white',
      process9Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process9HideShape: false,
      process9Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: 'Transactions sécurisées',
            description:
              'Nulla vitae elit libero pharetra augue dapibus. Praesent commodo cursus.',
            className: 'd-flex flex-row mb-5',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: 'Planification des factures',
            description:
              'Vivamus sagittis lacus vel augue laoreet. Etiam porta sem malesuada magna.',
            className: 'd-flex flex-row mb-5',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: 'Toujours à jour',
            description:
              'Cras mattis consectetur purus sit amet. Aenean lacinia bibendum nulla sed.',
            className: 'd-flex flex-row',
          },
        },
      ],
    },
  },
];
