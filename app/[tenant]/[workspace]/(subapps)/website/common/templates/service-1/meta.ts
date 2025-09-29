import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {solidIconsSelection, linkColorsSelection} from '../meta-selections';

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
      defaultValue: 'container pt-14 pt-md-16',
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
          selection: 'solid-icons',
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
          selection: 'link-colors',
        },
      ],
    },
  ],
  selections: [solidIconsSelection, linkColorsSelection],
} as const satisfies TemplateSchema;

export type Service1Data = Data<typeof service1Schema>;

export const service1Demos: Demo<typeof service1Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-1',
    sequence: 2,
    data: {
      service1Caption: 'What We Do?',
      service1Title:
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
    page: 'demo-1',
    sequence: 2,
    data: {
      service1Caption: 'Que faisons-nous ?',
      service1Title:
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
