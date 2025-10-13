import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {uniconsSelection} from '../meta-selections';

export const service3Code = 'service3';

export const service3Schema = {
  title: 'Service 3',
  code: service3Code,
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
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service3Service',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [
    {
      name: 'Service3Service',
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'unicons',
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
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

export type Service3Data = Data<typeof service3Schema>;

export const service3Demos: Demo<typeof service3Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-2',
    sequence: 3,
    data: {
      service3Title: 'What We Do?',
      service3Caption:
        'We took pleasure in offering unique solutions to your particular needs.',
      service3Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'circuit',
            title: 'IoT Development',
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
            icon: 'processor',
            title: 'Artificial Intelligence',
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
            icon: 'setting',
            title: 'Software Maintenance',
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
            icon: 'lock-access',
            title: 'Cybersecurity',
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
    site: 'fr',
    page: 'demo-2',
    sequence: 3,
    data: {
      service3Title: 'Que faisons-nous ?',
      service3Caption:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service3Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'circuit',
            title: 'Développement IoT',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'processor',
            title: 'Intelligence artificielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'setting',
            title: 'Maintenance logicielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'lock-access',
            title: 'Cybersécurité',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            linkTitle: 'En savoir plus',
          },
        },
      ],
    },
  },
];
