import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const wiki1Schema = {
  title: 'Wiki 1',
  code: 'wiki1',
  type: Template.block,
  fields: [
    {
      name: 'content',
      title: 'Content',
      type: 'string',
    },
  ],
} as const satisfies TemplateSchema;

export type Wiki1Data = Data<typeof wiki1Schema>;

export const wiki1Demos: Demo<typeof wiki1Schema>[] = [
  {
    language: 'en_US',
    data: {
      wiki1Content: undefined,
    },
  },
  {
    language: 'fr_FR',
    data: {
      wiki1Content: undefined,
    },
  },
];
