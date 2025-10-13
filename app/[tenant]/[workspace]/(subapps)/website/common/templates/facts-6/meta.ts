import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {uniconsSelection, colorsSelection} from '../meta-selections';

export const facts6Code = 'facts6';

export const facts6Schema = {
  title: 'Facts 6',
  code: facts6Code,
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
      target: 'Facts6Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-15 mb-lg-18',
    },
  ],
  models: [
    {
      name: 'Facts6Facts',
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
        {
          name: 'color',
          title: 'Color',
          type: 'string',
          selection: 'colors',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'unicons',
        },
      ],
    },
  ],
  selections: [uniconsSelection, colorsSelection],
} as const satisfies TemplateSchema;

export type Facts6Data = Data<typeof facts6Schema>;

export const facts6Demos: Demo<typeof facts6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-7',
    sequence: 3,
    data: {
      facts6Title: 'Connect with Our Community',
      facts6Caption:
        'We designed our company services to help you at every level of your development.',
      facts6Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      facts6Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projects Done',
            amount: 2564,
            color: 'soft-purple',
            icon: 'presentation-check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Customers',
            amount: 1655,
            color: 'soft-red',
            icon: 'users-alt',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            amount: 656,
            color: 'soft-yellow',
            icon: 'user-check',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Awards Won',
            amount: 545,
            color: 'soft-aqua',
            icon: 'trophy',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-7',
    sequence: 3,
    data: {
      facts6Title: 'Connectez-vous avec notre communauté',
      facts6Caption:
        'Nous avons conçu les services de notre entreprise pour vous aider à chaque niveau de votre développement.',
      facts6Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes.',
      facts6Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets réalisés',
            amount: 2564,
            color: 'soft-purple',
            icon: 'presentation-check',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            amount: 1655,
            color: 'soft-red',
            icon: 'users-alt',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            amount: 656,
            color: 'soft-yellow',
            icon: 'user-check',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            amount: 545,
            color: 'soft-aqua',
            icon: 'trophy',
          },
        },
      ],
    },
  },
];
