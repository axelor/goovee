import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const pageProgress1Code = 'pageProgress1';

export const pageProgress1Schema = {
  title: 'Page Progress 1',
  code: pageProgress1Code,
  type: Template.block,
  fields: [],
} as const satisfies TemplateSchema;

export type PageProgress1Data = Data<typeof pageProgress1Schema>;

export const pageProgress1Demos: Demo<typeof pageProgress1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 10,
    data: {},
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 10,
    data: {},
  },
];
