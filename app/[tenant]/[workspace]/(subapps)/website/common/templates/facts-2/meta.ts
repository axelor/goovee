import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {startCase} from 'lodash-es';

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
          selection: solidIcons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts2Data = Data<typeof facts2Schema>;

export const facts2Demos: Demo<typeof facts2Schema>[] = [
  {
    language: 'en_US',
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
];
