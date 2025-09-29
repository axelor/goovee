import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {uniconsSelection} from '../meta-selections';

export const service14Schema = {
  title: 'Service 14',
  code: 'service14',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service14Service',
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
      defaultValue: 'container pt-14 pt-md-17 mb-14 mb-md-17',
    },
  ],
  models: [
    {
      name: 'Service14Service',
      title: 'Service',
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
          selection: 'unicons',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'linkUrl',
          title: 'Link Url',
          type: 'string',
        },
        {
          name: 'linkTitle',
          title: 'Link Title',
          type: 'string',
        },
      ],
    },
  ],
  selections: [uniconsSelection],
} as const satisfies TemplateSchema;

export type Service14Data = Data<typeof service14Schema>;

export const service14Demos: Demo<typeof service14Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-11',
    sequence: 2,
    data: {
      service14Caption: 'What We Do?',
      service14Title:
        'The service we offer is specifically designed to meet your needs.',
      service14Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'IoT Development',
            icon: 'circuit',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            linkTitle: 'Learn More',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Artificial Intelligence',
            icon: 'processor',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            linkTitle: 'Learn More',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Software Maintenance',
            icon: 'setting',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            linkTitle: 'Learn More',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Cybersecurity',
            icon: 'lock-access',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            linkTitle: 'Learn More',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-11',
    sequence: 2,
    data: {
      service14Caption: 'Que faisons-nous ?',
      service14Title:
        'Le service que nous proposons est spécialement conçu pour répondre à vos besoins.',
      service14Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Développement IoT',
            icon: 'circuit',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Intelligence artificielle',
            icon: 'processor',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Maintenance logicielle',
            icon: 'setting',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Cybersécurité',
            icon: 'lock-access',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
      ],
    },
  },
];
