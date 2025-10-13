import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts16Code = 'facts16';

export const facts16Schema = {
  title: 'Facts 16',
  code: facts16Code,
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
      target: 'Facts16Facts',
    },
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'section-frame overflow-hidden',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary rounded-4',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-17',
    },
  ],
  models: [
    {
      name: 'Facts16Facts',
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'color',
          title: 'Color',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts16Data = Data<typeof facts16Schema>;

export const facts16Demos: Demo<typeof facts16Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-22',
    sequence: 5,
    data: {
      facts16Title:
        'Saving both time and cash by working with our qualified team.',
      facts16Caption: 'Company Facts',
      facts16Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'New Users',
            value: 75,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'purple',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Social Networks',
            value: 80,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'leaf',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Referrals',
            value: 60,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'pink',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'New Domain',
            value: 90,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'orange',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-22',
    sequence: 5,
    data: {
      facts16Title:
        'Économiser du temps et de l’argent en travaillant avec notre équipe qualifiée.',
      facts16Caption: 'Faits sur l’entreprise',
      facts16Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Nouveaux utilisateurs',
            value: 75,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'purple',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Réseaux sociaux',
            value: 80,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'leaf',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Références',
            value: 60,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'pink',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Nouveau domaine',
            value: 90,
            description: 'Maecenas faucibus mollis interdum. Aenean eu leo.',
            color: 'orange',
          },
        },
      ],
    },
  },
];
