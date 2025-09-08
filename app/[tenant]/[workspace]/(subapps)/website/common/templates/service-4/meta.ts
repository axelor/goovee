import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const service4Schema = {
  title: 'Service 4',
  code: 'service4',
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
      target: 'Service4Service',
    },
  ],
  models: [
    {
      name: 'Service4Service',
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
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'string',
        },
        {
          name: 'iconBoxClassNames',
          title: 'Icon Box Class Names',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Service4Data = Data<typeof service4Schema>;

export const service4Demos: Demo<typeof service4Schema>[] = [
  {
    language: 'en_US',
    data: {
      service4Title: 'What We Do?',
      service4Caption:
        'We took pleasure in offering unique solutions to your particular needs.',
      service4Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'uil-circuit',
            title: 'IoT Development',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'uil-processor',
            title: 'Artificial Intelligence',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'uil-setting',
            title: 'Software Maintenance',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'uil-lock-access',
            title: 'Cybersecurity',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service4Title: 'Que faisons-nous ?',
      service4Caption:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service4Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'uil-circuit',
            title: 'Développement IoT',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'uil-processor',
            title: 'Intelligence artificielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'uil-setting',
            title: 'Maintenance logicielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'uil-lock-access',
            title: 'Cybersécurité',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
            linkUrl: '#',
            iconBoxClassNames:
              'icon btn btn-block btn-lg btn-soft-primary pe-none mb-6',
          },
        },
      ],
    },
  },
];
