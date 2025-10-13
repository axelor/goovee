import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts7Code = 'facts7';

export const facts7Schema = {
  title: 'Facts 7',
  code: facts7Code,
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
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts7Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-dark',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 pt-md-17 pb-md-21',
    },
  ],
  models: [
    {
      name: 'Facts7Facts',
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

export type Facts7Data = Data<typeof facts7Schema>;

export const facts7Demos: Demo<typeof facts7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-10',
    sequence: 4,
    data: {
      facts7Title: 'We are proud of our achievements.',
      facts7Description:
        'Let us handle your business needs while you sit back and relax.',
      facts7Facts: [
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
    page: 'demo-10',
    sequence: 4,
    data: {
      facts7Title: 'Nous sommes fiers de nos réalisations.',
      facts7Description:
        'Laissez-nous répondre aux besoins de votre entreprise pendant que vous vous asseyez et vous détendez.',
      facts7Facts: [
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
