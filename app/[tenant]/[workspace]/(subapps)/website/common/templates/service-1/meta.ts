import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {solidIconsSelection, linkColorsSelection} from '../meta-selections';

export const service1Code = 'service1';

export const service1Schema = {
  title: 'Service 1',
  code: service1Code,
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
    site: 'lighthouse-en',
    page: 'demo-1',
    sequence: 2,
    data: {
      service1Caption: 'What We Do?',
      service1Title:
        'We have designed our services with your specific needs in mind.',
      service1Services: [
        {
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
    site: 'lighthouse-fr',
    page: 'demo-1',
    sequence: 2,
    data: {
      service1Caption: 'Que faisons-nous ?',
      service1Title:
        'Nous avons conçu nos services en pensant à vos besoins spécifiques.',
      service1Services: [
        {
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
