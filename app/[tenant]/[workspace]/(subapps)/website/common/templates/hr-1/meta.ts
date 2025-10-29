import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const hr1Code = 'hr1';

export const hr1Schema = {
  title: 'HR 1',
  code: hr1Code,
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
    site: 'lighthouse-en',
    page: 'demo-4',
    sequence: 3,
    data: {
      hr1ClassName: 'container my-14 my-md-17',
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-4',
    sequence: 3,
    data: {
      hr1ClassName: 'container my-14 my-md-17',
    },
  },
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-4',
    sequence: 8,
    data: {
      hr1ClassName: 'container mt-15 mt-md-18 mb-14 mb-md-17',
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-4',
    sequence: 8,
    data: {
      hr1ClassName: 'container mt-15 mt-md-18 mb-14 mb-md-17',
    },
  },
];
