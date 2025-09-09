import {startCase} from 'lodash-es';
import {unicons} from '../../constants/unicons';
import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service13Schema = {
  title: 'Service 13',
  code: 'service13',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
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
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service13Service',
    },
  ],
  models: [
    {
      name: 'Service13Service',
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
          selection: unicons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
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
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service13Data = Data<typeof service13Schema>;

export const service13Demos: Demo<typeof service13Schema>[] = [
  {
    language: 'en_US',
    data: {
      service13Title: 'Our service is customized to the unique needs of you.',
      service13Image: {
        id: '1',
        version: 1,
        fileName: 'about15.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about15.jpg',
      },
      service13Services: [
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
    data: {
      service13Title:
        'Notre service est personnalisé pour répondre à vos besoins uniques.',
      service13Image: {
        id: '1',
        version: 1,
        fileName: 'about15.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about15.jpg',
      },
      service13Services: [
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
