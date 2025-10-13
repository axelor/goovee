import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts11Code = 'facts11';

export const facts11Schema = {
  title: 'Facts 11',
  code: facts11Code,
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
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts11Facts',
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
      name: 'Facts11Facts',
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
          name: 'amount',
          title: 'Amount',
          type: 'integer',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts11Data = Data<typeof facts11Schema>;

export const facts11Demos: Demo<typeof facts11Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 4,
    data: {
      facts11Title: 'We feel proud of our achievements.',
      facts11Caption: 'Company Facts',
      facts11Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            amount: 10000,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            amount: 5000,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            amount: 265,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-17',
    sequence: 4,
    data: {
      facts11Title: 'Nous sommes fiers de nos réalisations.',
      facts11Caption: 'Faits sur l’entreprise',
      facts11Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            amount: 10000,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            amount: 5000,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            amount: 265,
          },
        },
      ],
    },
  },
];
