import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection} from '../meta-selections';

export const process13Schema = {
  title: 'Process 13',
  code: 'process13',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
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
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process13Processes',
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
      defaultValue: 'container py-15 py-md-17',
    },
  ],
  models: [
    {
      name: 'Process13Processes',
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Process13Data = Data<typeof process13Schema>;

export const process13Demos: Demo<typeof process13Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-20',
    sequence: 3,
    data: {
      process13Caption: 'Our Working Process',
      process13Heading: 'Here are the 3 working steps on success.',
      process13Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process13Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Rocket',
            title: '1. Personalized service',
            description:
              'We believe in getting to know our customers understand their unique.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: '2. Competitive pricing',
            description:
              'We believe in getting to know our customers understand their unique.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'TruckMedical',
            title: '3. Timely delivery',
            description:
              'We believe in getting to know our customers understand their unique.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-20',
    sequence: 3,
    data: {
      process13Caption: 'Notre processus de travail',
      process13Heading: 'Voici les 3 étapes de travail vers le succès.',
      process13Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      process13Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Rocket',
            title: '1. Service personnalisé',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: '2. Prix compétitifs',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'TruckMedical',
            title: '3. Livraison à temps',
            description:
              'Nous croyons qu’il est important de connaître nos clients et de comprendre leur caractère unique.',
          },
        },
      ],
    },
  },
];
