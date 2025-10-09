import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts1Schema = {
  title: 'Facts 1',
  code: 'facts1',
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
      target: 'Facts1Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary angled lower-start',
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
      name: 'Facts1Facts',
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
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts1Data = Data<typeof facts1Schema>;

export const facts1Demos: Demo<typeof facts1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-3',
    sequence: 7,
    data: {
      facts1Title: 'We feel proud of our achievements.',
      facts1Caption: 'Company Facts',
      facts1Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            number: 10000,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            number: 5000,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            number: 265,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-3',
    sequence: 7,
    data: {
      facts1Title: 'Nous sommes fiers de nos réalisations.',
      facts1Caption: 'Faits sur l’entreprise',
      facts1Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            number: 10000,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            number: 5000,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            number: 265,
          },
        },
      ],
    },
  },
];
