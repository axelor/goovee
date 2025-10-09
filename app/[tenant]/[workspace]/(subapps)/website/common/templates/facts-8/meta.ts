import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts8Schema = {
  title: 'Facts 8',
  code: 'facts8',
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
      target: 'Facts8Facts',
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
      defaultValue: 'container py-14 pt-md-15 pb-md-20',
    },
  ],
  models: [
    {
      name: 'Facts8Facts',
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
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts8Data = Data<typeof facts8Schema>;

export const facts8Demos: Demo<typeof facts8Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-12',
    sequence: 5,
    data: {
      facts8Title: 'We feel proud of our achievements.',
      facts8Description:
        'Let us handle your business needs while you sit back and relax.',
      facts8Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            number: 200,
            suffix: '+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            number: 1,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            number: 100,
            suffix: '+',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-12',
    sequence: 5,
    data: {
      facts8Title: 'Nous sommes fiers de nos réalisations.',
      facts8Description:
        'Laissez-nous répondre aux besoins de votre entreprise pendant que vous vous asseyez et vous détendez.',
      facts8Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            number: 200,
            suffix: '+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            number: 1,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            number: 100,
            suffix: '+',
          },
        },
      ],
    },
  },
];
