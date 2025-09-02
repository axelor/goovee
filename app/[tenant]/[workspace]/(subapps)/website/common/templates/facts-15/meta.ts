import {startCase} from 'lodash-es';
import {unicons} from '../../constants/unicons';
import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts15Schema = {
  title: 'Facts 15',
  code: 'facts15',
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
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts15Facts',
    },
  ],
  models: [
    {
      name: 'Facts15Facts',
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
          selection: unicons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Facts15Data = Data<typeof facts15Schema>;

export const facts15Demos: Demo<typeof facts15Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts15Title: 'We feel proud of our achievements.',
      facts15Caption: 'Company Facts',
      facts15Description:
        'We bring solutions to make life easier for our customers.',
      facts15Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            number: 10,
            suffix: 'K+',
            icon: 'presentation-check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Customers',
            number: 5,
            suffix: 'K+',
            icon: 'user-check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            number: 265,
            suffix: '+',
            icon: 'trophy',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      facts15Title: 'Nous sommes fiers de nos réalisations.',
      facts15Caption: 'Faits sur l’entreprise',
      facts15Description:
        'Nous apportons des solutions pour faciliter la vie de nos clients.',
      facts15Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            number: 10,
            suffix: 'K+',
            icon: 'presentation-check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            number: 5,
            suffix: 'K+',
            icon: 'user-check',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            number: 265,
            suffix: '+',
            icon: 'trophy',
          },
        },
      ],
    },
  },
];
