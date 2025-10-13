import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection} from '../meta-selections';

export const service20Code = 'service20';

export const service20Schema = {
  title: 'Service 20',
  code: service20Code,
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
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service20Service',
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
      defaultValue: 'container pt-14 pt-md-17 mb-17',
    },
  ],
  models: [
    {
      name: 'Service20Service',
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
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service20Data = Data<typeof service20Schema>;

export const service20Demos: Demo<typeof service20Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-18',
    sequence: 2,
    data: {
      service20Caption: 'Our Features',
      service20Description:
        'Sandbox is the only app you need to track your goals for better health.',
      service20Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Code',
            title: 'IoT Development',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'AI',
            title: 'Artificial Intelligence',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Software Maintenance',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Shield',
            title: 'Cybersecurity',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            icon: 'Rocket',
            title: 'IT Consulting',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            icon: 'Cart',
            title: 'E-commerce Solutions',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-18',
    sequence: 2,
    data: {
      service20Caption: 'Nos fonctionnalités',
      service20Description:
        'Sandbox est la seule application dont vous avez besoin pour suivre vos objectifs pour une meilleure santé.',
      service20Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Code',
            title: 'Développement IoT',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'AI',
            title: 'Intelligence artificielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Maintenance logicielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Shield',
            title: 'Cybersécurité',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            icon: 'Rocket',
            title: 'Conseil en informatique',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            icon: 'Cart',
            title: 'Solutions de commerce électronique',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
      ],
    },
  },
];
