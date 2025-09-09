import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {startCase} from 'lodash-es';
import {linkColors} from '../../constants/colors';

export const service1Schema = {
  title: 'Service 1',
  code: 'service1',
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
      target: 'Service1Services',
    },
  ],
  models: [
    {
      name: 'Service1Services',
      title: 'Service 1 Services',
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
          selection: solidIcons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
        },
        {
          name: 'link',
          title: 'Link',
          type: 'string',
          visibleInGrid: true,
        },
        {
          name: 'linkType',
          title: 'Link Type',
          type: 'string',
          visibleInGrid: true,
          selection: linkColors.map(color => ({
            title: startCase(color),
            value: color,
          })),
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Service1Data = Data<typeof service1Schema>;

export const service1Demos: Demo<typeof service1Schema>[] = [
  {
    language: 'en_US',
    data: {
      service1Title: 'What We Do?',
      service1Caption:
        'We have designed our services with your specific needs in mind.',
      service1Services: [
        {
          id: '5',
          version: 1,
          attrs: {
            icon: 'Rocket',
            link: '#',
            title: 'DevOps',
            linkType: 'yellow',
            description:
              'The agency can provide DevOps services to help businesses streamline their software development',
          },
        },
        {
          id: '6',
          version: 1,
          attrs: {
            icon: 'Code',
            link: '#',
            title: 'Software Development',
            linkType: 'red',
            description:
              'The agency can provide DevOps services to help businesses streamline their software development',
          },
        },
        {
          id: '7',
          version: 0,
          attrs: {
            icon: 'DevicesTwo',
            link: '#',
            title: 'App Development',
            linkType: 'green',
            description:
              'The agency can provide DevOps services to help businesses streamline their software development',
          },
        },
        {
          id: '8',
          version: 1,
          attrs: {
            link: '#',
            icon: 'Hand',
            linkType: 'blue',
            title: 'Maintenance & Support',
            description: `The agency can provide DevOps services to help businesses streamline their software development`,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service1Title: 'Que faisons-nous ?',
      service1Caption:
        'Nous avons conçu nos services en pensant à vos besoins spécifiques.',
      service1Services: [
        {
          id: '5',
          version: 1,
          attrs: {
            icon: 'Rocket',
            link: '#',
            title: 'DevOps',
            linkType: 'yellow',
            description:
              "L'agence peut fournir des services DevOps pour aider les entreprises à rationaliser leur développement de logiciels",
          },
        },
        {
          id: '6',
          version: 1,
          attrs: {
            icon: 'Code',
            link: '#',
            title: 'Développement de logiciels',
            linkType: 'red',
            description:
              "L'agence peut fournir des services DevOps pour aider les entreprises à rationaliser leur développement de logiciels",
          },
        },
        {
          id: '7',
          version: 0,
          attrs: {
            icon: 'DevicesTwo',
            link: '#',
            title: "Développement d'applications",
            linkType: 'green',
            description:
              "L'agence peut fournir des services DevOps pour aider les entreprises à rationaliser leur développement de logiciels",
          },
        },
        {
          id: '8',
          version: 1,
          attrs: {
            link: '#',
            icon: 'Hand',
            linkType: 'blue',
            title: 'Maintenance et assistance',
            description: `L'agence peut fournir des services DevOps pour aider les entreprises à rationaliser leur développement de logiciels`,
          },
        },
      ],
    },
  },
];
