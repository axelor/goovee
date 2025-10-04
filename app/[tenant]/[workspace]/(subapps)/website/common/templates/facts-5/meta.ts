import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {linealIconsSelection} from '../meta-selections';

export const facts5Schema = {
  title: 'Facts 5',
  code: 'facts5',
  type: Template.block,
  fields: [
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts5Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
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
      name: 'Facts5Facts',
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
          name: 'value',
          title: 'Value',
          type: 'integer',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'lineal-icons',
        },
      ],
    },
  ],
  selections: [linealIconsSelection],
} as const satisfies TemplateSchema;

export type Facts5Data = Data<typeof facts5Schema>;

export const facts5Demos: Demo<typeof facts5Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-15',
    sequence: 6,
    data: {
      facts5Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            value: 7518,
            icon: 'Check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Satisfied Customers',
            value: 3472,
            icon: 'User',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            value: 2184,
            icon: 'BriefcaseTwo',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Awards Won',
            value: 4523,
            icon: 'AwardTwo',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-15',
    sequence: 6,
    data: {
      facts5Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            value: 7518,
            icon: 'Check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients satisfaits',
            value: 3472,
            icon: 'User',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            value: 2184,
            icon: 'BriefcaseTwo',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            value: 4523,
            icon: 'AwardTwo',
          },
        },
      ],
    },
  },
];
