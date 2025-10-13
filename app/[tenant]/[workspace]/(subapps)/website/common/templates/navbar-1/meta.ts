import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const navbar1Code = 'navbar1';

export const navbar1Schema = {
  title: 'Navbar 1',
  code: navbar1Code,
  type: Template.topMenu,
  fields: [],
} as const satisfies TemplateSchema;

export type Navbar1Data = Data<typeof navbar1Schema>;

export const navbar1Demos: Demo<typeof navbar1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 9,
    data: {},
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 9,
    data: {},
  },
];
