import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const navbar1Schema = {
  title: 'Navbar 1',
  code: 'navbar1',
  type: Template.topMenu,
  fields: [],
} as const satisfies TemplateSchema;

export type Navbar1Data = Data<typeof navbar1Schema>;

export const navbar1Demos: Demo<typeof navbar1Schema>[] = [
  {
    language: 'en_US',
    data: {},
  },
  {
    language: 'fr_FR',
    data: {},
  },
];
