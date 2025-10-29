import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {uniconsSelection} from '../meta-selections';

export const service13Code = 'service13';

export const service13Schema = {
  title: 'Service 13',
  code: service13Code,
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
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service13Service',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-dark',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
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
    imageModel,
  ],
  selections: [uniconsSelection],
} as const satisfies TemplateSchema;

export type Service13Data = Data<typeof service13Schema>;

export const service13Demos: Demo<typeof service13Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-10',
    sequence: 2,
    data: {
      service13Title: 'Our service is customized to the unique needs of you.',
      service13Image: {
        attrs: {
          alt: 'Our service',
          width: 1200,
          height: 582,
          image: {
            fileName: 'about15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about15.jpg',
          },
        },
      },
      service13Services: [
        {
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
    site: 'lighthouse-fr',
    page: 'demo-10',
    sequence: 2,
    data: {
      service13Title:
        'Notre service est personnalisé pour répondre à vos besoins uniques.',
      service13Image: {
        attrs: {
          alt: 'Notre service',
          width: 1200,
          height: 582,
          image: {
            fileName: 'about15.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about15.jpg',
          },
        },
      },
      service13Services: [
        {
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
