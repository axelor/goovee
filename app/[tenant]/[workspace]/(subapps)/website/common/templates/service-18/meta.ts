import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection, colorsSelection} from '../meta-selections';

export const service18Code = 'service18';

export const service18Schema = {
  title: 'Service 18',
  code: service18Code,
  type: Template.block,
  fields: [
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
      name: 'services1',
      title: 'Services 1',
      type: 'json-one-to-many',
      target: 'Service18Service1',
    },
    {
      name: 'services2',
      title: 'Services 2',
      type: 'json-one-to-many',
      target: 'Service18Service2',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light wrapper-border',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-18',
    },
  ],
  models: [
    {
      name: 'Service18Service1',
      title: 'Service 1',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'percent',
          title: 'Percent',
          type: 'integer',
        },
        {
          name: 'color',
          title: 'Color',
          type: 'string',
          selection: 'colors',
        },
      ],
    },
    {
      name: 'Service18Service2',
      title: 'Service 2',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
  selections: [solidIconsSelection, colorsSelection],
} as const satisfies TemplateSchema;

export type Service18Data = Data<typeof service18Schema>;

export const service18Demos: Demo<typeof service18Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-16',
    sequence: 2,
    data: {
      service18Caption: 'My Services',
      service18Description:
        'Software engineers offer services related to software development, web and mobile app development, DevOps, cloud computing, database management, software testing, maintenance and support, consulting, and custom software development.',
      service18Services1: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'JavaScript',
            percent: 100,
            color: 'soft-violet',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'AWS',
            percent: 80,
            color: 'soft-blue',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'PHP',
            percent: 85,
            color: 'soft-leaf',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'MongoDB',
            percent: 90,
            color: 'soft-pink',
          },
        },
      ],
      service18Services2: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Code',
            title: 'Software Development',
            description: `Software engineers develop software solutions using various technologies to meet clients\’ needs.`,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'DevicesThree',
            title: 'DevOps',
            description: `Software engineers develop software solutions using various technologies to meet clients\’ needs.`,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Web Design',
            description: `Software engineers develop software solutions using various technologies to meet clients\’ needs.`,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Headphone',
            title: 'Support',
            description: `Software engineers develop software solutions using various technologies to meet clients\’ needs.`,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-16',
    sequence: 2,
    data: {
      service18Caption: 'Mes services',
      service18Description:
        'Les ingénieurs logiciels proposent des services liés au développement de logiciels, au développement d’applications Web et mobiles, au DevOps, au cloud computing, à la gestion de bases de données, aux tests de logiciels, à la maintenance et au support, au conseil et au développement de logiciels personnalisés.',
      service18Services1: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'JavaScript',
            percent: 100,
            color: 'soft-violet',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'AWS',
            percent: 80,
            color: 'soft-blue',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'PHP',
            percent: 85,
            color: 'soft-leaf',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'MongoDB',
            percent: 90,
            color: 'soft-pink',
          },
        },
      ],
      service18Services2: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Code',
            title: 'Développement de logiciels',
            description:
              'Les ingénieurs logiciels développent des solutions logicielles utilisant diverses technologies pour répondre aux besoins des clients.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'DevicesThree',
            title: 'DevOps',
            description:
              'Les ingénieurs logiciels développent des solutions logicielles utilisant diverses technologies pour répondre aux besoins des clients.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Conception de sites Web',
            description:
              'Les ingénieurs logiciels développent des solutions logicielles utilisant diverses technologies pour répondre aux besoins des clients.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Headphone',
            title: 'Support',
            description:
              'Les ingénieurs logiciels développent des solutions logicielles utilisant diverses technologies pour répondre aux besoins des clients.',
          },
        },
      ],
    },
  },
];
