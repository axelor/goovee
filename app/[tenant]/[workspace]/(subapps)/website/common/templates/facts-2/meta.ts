import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection} from '../meta-selections';

export const facts2Schema = {
  title: 'Facts 2',
  code: 'facts2',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts2Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light position-relative mb-11',
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
      name: 'Facts2Facts',
      title: 'Facts',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'number',
          title: 'Number',
          type: 'integer',
        },
        {
          name: 'suffix',
          title: 'Suffix',
          type: 'string',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
      ],
    },
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Facts2Data = Data<typeof facts2Schema>;

export const facts2Demos: Demo<typeof facts2Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-4',
    sequence: 6,
    data: {
      facts2Title: 'We feel proud of our achievements.',
      facts2Subtitle:
        'Let us handle your business needs while you sit back and relax.',
      facts2Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Happy Customers',
            number: 30,
            suffix: 'K+',
            icon: 'User',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            number: 10,
            suffix: 'K+',
            icon: 'Check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            number: 3,
            suffix: 'K+',
            icon: 'Briefcase',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-4',
    sequence: 6,
    data: {
      facts2Title: 'Nous sommes fiers de nos réalisations.',
      facts2Subtitle:
        'Laissez-nous répondre aux besoins de votre entreprise pendant que vous vous asseyez et vous détendez.',
      facts2Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            number: 30,
            suffix: 'K+',
            icon: 'User',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            number: 10,
            suffix: 'K+',
            icon: 'Check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            number: 3,
            suffix: 'K+',
            icon: 'Briefcase',
          },
        },
      ],
    },
  },
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-8',
    sequence: 6,
    data: {
      facts2WrapperClassName: 'wrapper bg-light mb-11',
      facts2ContainerClassName: 'container',
      facts2Title: 'We feel proud of our achievements.',
      facts2Subtitle:
        'Let us handle your business needs while you sit back and relax.',
      facts2Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Happy Customers',
            number: 30,
            suffix: 'K+',
            icon: 'User',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            number: 10,
            suffix: 'K+',
            icon: 'Check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            number: 3,
            suffix: 'K+',
            icon: 'Briefcase',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-8',
    sequence: 6,
    data: {
      facts2WrapperClassName: 'wrapper bg-light',
      facts2ContainerClassName: 'container',
      facts2Title: 'Nous sommes fiers de nos réalisations.',
      facts2Subtitle:
        'Laissez-nous répondre aux besoins de votre entreprise pendant que vous vous asseyez et vous détendez.',
      facts2Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            number: 30,
            suffix: 'K+',
            icon: 'User',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            number: 10,
            suffix: 'K+',
            icon: 'Check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            number: 3,
            suffix: 'K+',
            icon: 'Briefcase',
          },
        },
      ],
    },
  },
];
