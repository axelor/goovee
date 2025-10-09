import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const hr1Schema = {
  title: 'HR 1',
  code: 'hr1',
  type: Template.block,
  fields: [
    {
      name: 'className',
      title: 'Class Name',
      type: 'string',
      defaultValue: 'container my-14 my-md-17',
    },
  ],
} as const satisfies TemplateSchema;

export type HR1Data = Data<typeof hr1Schema>;

export const hr1Demos: Demo<typeof hr1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-4',
    sequence: 3,
    data: {
      hr1ClassName: 'container my-14 my-md-17',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-4',
    sequence: 3,
    data: {
      hr1ClassName: 'container my-14 my-md-17',
    },
  },
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-4',
    sequence: 8,
    data: {
      hr1ClassName: 'container mt-15 mt-md-18 mb-14 mb-md-17',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-4',
    sequence: 8,
    data: {
      hr1ClassName: 'container mt-15 mt-md-18 mb-14 mb-md-17',
    },
  },
];
