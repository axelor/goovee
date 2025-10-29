import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {
  solidIconsSelection,
  fullColorsSelection,
  colorsSelection,
} from '../meta-selections';

export const service9Code = 'service9';

export const service9Schema = {
  title: 'Service 9',
  code: service9Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
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
      name: 'serviceList',
      title: 'Service List',
      type: 'json-one-to-many',
      target: 'Service9ServiceList',
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
      name: 'Service9ServiceList',
      title: 'Service List',
      fields: [
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
        {
          name: 'iconColor',
          title: 'Icon Color',
          type: 'string',
          selection: 'full-colors',
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
        {
          name: 'columnClass',
          title: 'Column Class',
          type: 'string',
        },
        {
          name: 'cardColor',
          title: 'Card Color',
          type: 'string',
          selection: 'full-colors',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [solidIconsSelection, fullColorsSelection, colorsSelection],
} as const satisfies TemplateSchema;

export type Service9Data = Data<typeof service9Schema>;

export const service9Demos: Demo<typeof service9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'others',
    sequence: 11,
    data: {
      service9Title:
        'Our service is customized to your individual requirements.',
      service9Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Goals and interact with one another in a shared location or virtual space.',
      service9Caption: 'What We Provide?',
      service9LinkTitle: 'More Details',
      service9LinkHref: '#',
      service9ServiceList: [
        {
          attrs: {
            icon: 'DevicesThree',
            title: 'IoT Development',
            description:
              'IoT development, devices are connected to the internet provide useful.',
            columnClass: 'col-md-5 offset-md-1 align-self-end',
            cardColor: 'pale-yellow',
            iconColor: 'yellow',
          },
        },
        {
          attrs: {
            icon: 'AI',
            title: 'Artificial Intelligence',
            description:
              'IoT development, devices are connected to the internet provide useful.',
            columnClass: 'col-md-6 align-self-end',
            cardColor: 'pale-red',
            iconColor: 'red',
          },
        },
        {
          attrs: {
            icon: 'Setting',
            title: 'Software Maintenance',
            description:
              'IoT development, devices are connected to the internet provide useful.',
            columnClass: 'col-md-5',
            cardColor: 'pale-leaf',
            iconColor: 'leaf',
          },
        },
        {
          attrs: {
            icon: 'Shield',
            title: 'Cybersecurity',
            description:
              'IoT development, devices are connected to the internet provide useful.',
            columnClass: 'col-md-6 align-self-start',
            cardColor: 'pale-primary',
            iconColor: 'primary',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'others',
    sequence: 11,
    data: {
      service9Title:
        'Notre service est personnalisé pour répondre à vos besoins individuels.',
      service9Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et qui interagissent les unes avec les autres dans un lieu ou un espace virtuel partagé. Les objectifs et l’interaction les uns avec les autres dans un lieu ou un espace virtuel partagé.',
      service9Caption: 'Ce que nous offrons ?',
      service9LinkTitle: 'Plus de détails',
      service9LinkHref: '#',
      service9ServiceList: [
        {
          attrs: {
            icon: 'DevicesThree',
            title: 'Développement IoT',
            description:
              'Développement IoT, les appareils sont connectés à Internet pour fournir des services utiles.',
            columnClass: 'col-md-5 offset-md-1 align-self-end',
            cardColor: 'pale-yellow',
            iconColor: 'yellow',
          },
        },
        {
          attrs: {
            icon: 'AI',
            title: 'Intelligence artificielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet pour fournir des services utiles.',
            columnClass: 'col-md-6 align-self-end',
            cardColor: 'pale-red',
            iconColor: 'red',
          },
        },
        {
          attrs: {
            icon: 'Setting',
            title: 'Maintenance logicielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet pour fournir des services utiles.',
            columnClass: 'col-md-5',
            cardColor: 'pale-leaf',
            iconColor: 'leaf',
          },
        },
        {
          attrs: {
            icon: 'Shield',
            title: 'Cybersécurité',
            description:
              'Développement IoT, les appareils sont connectés à Internet pour fournir des services utiles.',
            columnClass: 'col-md-6 align-self-start',
            cardColor: 'pale-primary',
            iconColor: 'primary',
          },
        },
      ],
    },
  },
];
