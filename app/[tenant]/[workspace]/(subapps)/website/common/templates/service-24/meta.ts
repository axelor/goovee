import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service24Schema = {
  title: 'Service 24',
  code: 'service24',
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
      target: 'Service24Service',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gradient-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-12 pt-lg-8 pb-14 pb-md-17',
    },
  ],
  models: [
    {
      name: 'Service24Service',
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
          name: 'linkTitle',
          title: 'Link Title',
          type: 'string',
        },
        {
          name: 'linkHref',
          title: 'Link Href',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service24Data = Data<typeof service24Schema>;

export const service24Demos: Demo<typeof service24Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-21',
    sequence: 2,
    data: {
      service24Caption: 'What We Do?',
      service24Title:
        'We took pleasure in offering unique solutions to your particular needs.',
      service24Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Web Design',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkTitle: 'Learn More',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i24.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i24.png',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Digital Marketing',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkTitle: 'Learn More',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i19.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i19.png',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Motion Graphics',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkTitle: 'Learn More',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i18.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i18.png',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-21',
    sequence: 2,
    data: {
      service24Caption: 'Que faisons-nous ?',
      service24Title:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service24Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Conception de sites Web',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i24.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i24.png',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Marketing numérique',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i19.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i19.png',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Graphiques animés',
            description:
              'Développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              id: '1',
              version: 1,
              fileName: 'i18.png',
              fileType: 'image/png',
              filePath: '/img/illustrations/i18.png',
            },
          },
        },
      ],
    },
  },
];
