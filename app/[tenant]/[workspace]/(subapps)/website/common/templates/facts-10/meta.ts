import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts10Code = 'facts10';

export const facts10Schema = {
  title: 'Facts 10',
  code: facts10Code,
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
      defaultValue: 'container py-14 pt-md-17 pb-md-19',
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
    site: 'lighthouse-en',
    page: 'demo-14',
    sequence: 5,
    data: {
      facts10Title: 'We feel proud of our achievements.',
      facts10Caption: 'Company Facts',
      facts10Facts: [
        {
          attrs: {
            title: 'Completed Projects',
            amount: 10000,
          },
        },
        {
          attrs: {
            title: 'Happy Clients',
            amount: 5000,
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-14',
    sequence: 5,
    data: {
      facts10Title: 'Nous sommes fiers de nos réalisations.',
      facts10Caption: 'Faits sur l’entreprise',
      facts10Facts: [
        {
          attrs: {
            title: 'Projets terminés',
            amount: 10000,
          },
        },
        {
          attrs: {
            title: 'Clients heureux',
            amount: 5000,
          },
        },
        {
          attrs: {
            title: 'Récompenses gagnées',
            amount: 265,
          },
        },
      ],
    },
  },
];
