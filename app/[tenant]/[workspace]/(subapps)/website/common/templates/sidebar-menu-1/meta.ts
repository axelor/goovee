import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const sidebarMenu1Code = 'sidebarMenu1';

export const sidebarMenu1Schema = {
  title: 'Sidebar Menu 1',
  code: sidebarMenu1Code,
  type: Template.leftRightMenu,
  fields: [],
} as const satisfies TemplateSchema;

export type SidebarMenu1Data = Data<typeof sidebarMenu1Schema>;

export const sidebarMenu1Demos: Demo<typeof sidebarMenu1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 12,
    data: {},
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 12,
    data: {},
  },
];
