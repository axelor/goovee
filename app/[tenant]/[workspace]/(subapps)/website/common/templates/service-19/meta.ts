import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {
  uniconsSelection,
  colorsSelection,
  linkColorsSelection,
} from '../meta-selections';

export const service19Code = 'service19';

export const service19Schema = {
  title: 'Service 19',
  code: service19Code,
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
      target: 'Service19Service',
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
      name: 'Service19Service',
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
          name: 'linkUrl',
          title: 'Link Url',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'iconColor',
          title: 'Icon Color',
          type: 'string',
          selection: 'colors',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'unicons',
        },
        {
          name: 'linkTitle',
          title: 'Link Title',
          type: 'string',
        },
        {
          name: 'linkColor',
          title: 'Link Color',
          type: 'string',
          selection: 'link-colors',
        },
      ],
    },
  ],
  selections: [uniconsSelection, colorsSelection, linkColorsSelection],
} as const satisfies TemplateSchema;

export type Service19Data = Data<typeof service19Schema>;

export const service19Demos: Demo<typeof service19Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-17',
    sequence: 2,
    data: {
      service19Caption: 'What We Do?',
      service19Description:
        'We have designed our services with your specific needs in mind.',
      service19Services: [
        {
          attrs: {
            title: 'IoT Development',
            linkUrl: '#',
            description:
              'IoT development, devices are connected to the internet devices are connected to the internet.',
            iconColor: 'soft-purple',
            linkColor: 'purple',
            icon: 'circuit',
            linkTitle: 'Learn More',
          },
        },
        {
          attrs: {
            title: 'Artificial Intelligence',
            linkUrl: '#',
            description:
              'IoT development, devices are connected to the internet devices are connected to the internet.',
            iconColor: 'soft-green',
            linkColor: 'green',
            icon: 'brain',
            linkTitle: 'Learn More',
          },
        },
        {
          attrs: {
            title: 'Software Maintenance',
            linkUrl: '#',
            description:
              'IoT development, devices are connected to the internet devices are connected to the internet.',
            iconColor: 'soft-orange',
            linkColor: 'orange',
            icon: 'process',
            linkTitle: 'Learn More',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-17',
    sequence: 2,
    data: {
      service19Caption: 'Que faisons-nous ?',
      service19Description:
        'Nous avons conçu nos services en pensant à vos besoins spécifiques.',
      service19Services: [
        {
          attrs: {
            title: 'Développement IoT',
            linkUrl: '#',
            description:
              'Développement IoT, les appareils sont connectés à Internet les appareils sont connectés à Internet.',
            iconColor: 'soft-purple',
            linkColor: 'purple',
            icon: 'circuit',
            linkTitle: 'En savoir plus',
          },
        },
        {
          attrs: {
            title: 'Intelligence artificielle',
            linkUrl: '#',
            description:
              'Développement IoT, les appareils sont connectés à Internet les appareils sont connectés à Internet.',
            iconColor: 'soft-green',
            linkColor: 'green',
            icon: 'brain',
            linkTitle: 'En savoir plus',
          },
        },
        {
          attrs: {
            title: 'Maintenance logicielle',
            linkUrl: '#',
            description:
              'Développement IoT, les appareils sont connectés à Internet les appareils sont connectés à Internet.',
            iconColor: 'soft-orange',
            linkColor: 'orange',
            icon: 'process',
            linkTitle: 'En savoir plus',
          },
        },
      ],
    },
  },
];
