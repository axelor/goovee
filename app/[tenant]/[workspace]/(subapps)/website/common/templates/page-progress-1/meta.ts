import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const pageProgress1Schema = {
  title: 'Page Progress 1',
  code: 'pageProgress1',
  type: Template.block,
  fields: [],
} as const satisfies TemplateSchema;

export type PageProgress1Data = Data<typeof pageProgress1Schema>;

export const pageProgress1Demos: Demo<typeof pageProgress1Schema>[] = [
  {
    language: 'en_US',
    page: 'others',
    sequence: 10,
    data: {},
  },
  {
    language: 'fr_FR',
    page: 'others',
    sequence: 10,
    data: {},
  },
];
