import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const facts3Schema = {
  title: 'Facts 3',
  code: 'facts3',
  type: Template.block,
  fields: [
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts3Facts',
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
      name: 'Facts3Facts',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Facts3Data = Data<typeof facts3Schema>;

export const facts3Demos: Demo<typeof facts3Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 6,
    data: {
      facts3BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Company achievements background',
          width: 1440,
          height: 512,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg3.jpg',
          },
        },
      },
      facts3Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            amount: 7518,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Satisfied Customers',
            amount: 3472,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Expert Employees',
            amount: 2184,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Awards Won',
            amount: 4523,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 6,
    data: {
      facts3BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: "Arrière-plan des réalisations de l'entreprise",
          width: 1440,
          height: 512,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg3.jpg',
          },
        },
      },
      facts3Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            amount: 7518,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients satisfaits',
            amount: 3472,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Employés experts',
            amount: 2184,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            amount: 4523,
          },
        },
      ],
    },
  },
];
