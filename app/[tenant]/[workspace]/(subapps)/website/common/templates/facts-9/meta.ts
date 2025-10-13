import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const facts9Code = 'facts9';

export const facts9Schema = {
  title: 'Facts 9',
  code: facts9Code,
  type: Template.block,
  fields: [
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts9Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled upper-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
    {
      name: 'rowClassName',
      title: 'Row Class Name',
      type: 'string',
      defaultValue: 'row',
    },
    {
      name: 'columnClassName',
      title: 'Column Class Name',
      type: 'string',
      defaultValue: 'col-12 mt-n20',
    },
  ],
  models: [
    {
      name: 'Facts9Facts',
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

export type Facts9Data = Data<typeof facts9Schema>;

export const facts9Demos: Demo<typeof facts9Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-13',
    sequence: 2,
    data: {
      facts9BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Company achievements background',
          width: 1440,
          height: 680,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg2.jpg',
          },
        },
      },
      facts9Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Company achievements',
          width: 1200,
          height: 650,
          image: {
            id: '1',
            version: 1,
            fileName: 'about5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about5.jpg',
          },
        },
      },
      facts9Facts: [
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
    page: 'demo-13',
    sequence: 2,
    data: {
      facts9BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: "Arrière-plan des réalisations de l'entreprise",
          width: 1440,
          height: 680,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg2.jpg',
          },
        },
      },
      facts9Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: "Réalisations de l'entreprise",
          width: 1200,
          height: 650,
          image: {
            id: '1',
            version: 1,
            fileName: 'about5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about5.jpg',
          },
        },
      },
      facts9Facts: [
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
