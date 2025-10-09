import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const cta5Schema = {
  title: 'CTA 5',
  code: 'cta5',
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
      name: 'inputLabel',
      title: 'Input Label',
      type: 'string',
    },
    {
      name: 'inputValue',
      title: 'Input Value',
      type: 'string',
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
      defaultValue: 'container py-14 py-md-16 text-center',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Cta5Data = Data<typeof cta5Schema>;

export const cta5Demos: Demo<typeof cta5Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-15',
    sequence: 8,
    data: {
      cta5Title: 'Visit Our Club!',
      cta5Caption:
        'Over 5000 clients have placed their trust in us. Join them by utilizing our services to help your business flourish.',
      cta5InputLabel: 'Email Address',
      cta5InputValue: 'Join',
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-15',
    sequence: 8,
    data: {
      cta5Title: 'Visitez notre club !',
      cta5Caption:
        'Plus de 5000 clients nous ont fait confiance. Rejoignez-les en utilisant nos services pour aider votre entreprise à prospérer.',
      cta5InputLabel: 'Adresse e-mail',
      cta5InputValue: 'Rejoindre',
    },
  },
];
