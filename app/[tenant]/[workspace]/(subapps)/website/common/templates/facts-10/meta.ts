import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts10Schema = {
  title: 'Facts 10',
  code: 'facts10',
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
      target: 'Facts10Facts',
    },
  ],
  models: [
    {
      name: 'Facts10Facts',
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

export type Facts10Data = Data<typeof facts10Schema>;

export const facts10Demos: Demo<typeof facts10Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts10Title: 'We feel proud of our achievements.',
      facts10Caption: 'Company Facts',
      facts10Facts: [
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
    data: {
      facts10Title: 'Nous sommes fiers de nos réalisations.',
      facts10Caption: 'Faits sur l’entreprise',
      facts10Facts: [
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
