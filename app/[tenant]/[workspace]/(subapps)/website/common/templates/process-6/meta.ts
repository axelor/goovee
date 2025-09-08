import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const process6Schema = {
  title: 'Process 6',
  code: 'process6',
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
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process6Processes',
    },
  ],
  models: [
    {
      name: 'Process6Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'Number',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Process6Data = Data<typeof process6Schema>;

export const process6Demos: Demo<typeof process6Schema>[] = [
  {
    language: 'en_US',
    data: {
      process6Title: 'Our Working Process',
      process6Caption:
        'We create expenses relaxed so that you maintain full control over them.',
      process6Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '01',
            title: 'Concept',
            subtitle:
              'Customers may choose offer high-quality product. Choose offer high-quality product.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '02',
            title: 'Prepare',
            subtitle:
              'Customers may choose offer high-quality product. Choose offer high-quality product.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            no: '03',
            title: 'Retouch',
            subtitle:
              'Customers may choose offer high-quality product. Choose offer high-quality product.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            no: '04',
            title: 'Finalize',
            subtitle:
              'Customers may choose offer high-quality product. Choose offer high-quality product.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      process6Title: 'Notre processus de travail',
      process6Caption:
        'Nous créons des dépenses détendues afin que vous puissiez en garder le contrôle total.',
      process6Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '01',
            title: 'Concept',
            subtitle:
              'Les clients peuvent choisir d’offrir des produits de haute qualité. Choisissez d’offrir un produit de haute qualité.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '02',
            title: 'Préparer',
            subtitle:
              'Les clients peuvent choisir d’offrir des produits de haute qualité. Choisissez d’offrir un produit de haute qualité.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            no: '03',
            title: 'Retoucher',
            subtitle:
              'Les clients peuvent choisir d’offrir des produits de haute qualité. Choisissez d’offrir un produit de haute qualité.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            no: '04',
            title: 'Finaliser',
            subtitle:
              'Les clients peuvent choisir d’offrir des produits de haute qualité. Choisissez d’offrir un produit de haute qualité.',
          },
        },
      ],
    },
  },
];
