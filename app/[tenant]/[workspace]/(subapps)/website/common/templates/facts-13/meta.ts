import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const facts13Schema = {
  title: 'Facts 13',
  code: 'facts13',
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
      name: 'heading1',
      title: 'Heading 1',
      type: 'string',
    },
    {
      name: 'heading2',
      title: 'Heading 2',
      type: 'string',
    },
    {
      name: 'dataValue1',
      title: 'Data Value 1',
      type: 'integer',
    },
    {
      name: 'dataValue2',
      title: 'Data Value 2',
      type: 'integer',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Facts13Data = Data<typeof facts13Schema>;

export const facts13Demos: Demo<typeof facts13Schema>[] = [
  {
    language: 'en_US',
    data: {
      facts13Title:
        'Choose our team of experts for reduced both cash and time.',
      facts13Caption: 'Save Time and Money',
      facts13Heading1: 'Customer Satisfaction',
      facts13Heading2: 'Increased Revenue',
      facts13DataValue1: 95,
      facts13DataValue2: 85,
    },
  },
  {
    language: 'fr_FR',
    data: {
      facts13Title:
        'Choisissez notre équipe d’experts pour réduire à la fois vos dépenses et votre temps.',
      facts13Caption: 'Économisez du temps et de l’argent',
      facts13Heading1: 'Satisfaction du client',
      facts13Heading2: 'Augmentation des revenus',
      facts13DataValue1: 95,
      facts13DataValue2: 85,
    },
  },
];
