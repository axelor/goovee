import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {formatCustomFieldName} from '@/subapps/website/common/utils/helper';
import {englishDemo, frenchDemo} from './demo-data';

const contentFieldName = 'content' as const;
export const wiki1Schema = {
  title: 'Wiki 1',
  code: 'wiki1',
  type: Template.block,
  fields: [
    {
      name: contentFieldName,
      title: 'Content',
      type: 'string',
    },
  ],
} as const satisfies TemplateSchema;

export function getWiki1ContentFieldName() {
  return formatCustomFieldName(contentFieldName, wiki1Schema.code);
}

export type Wiki1Data = Data<typeof wiki1Schema>;

export const wiki1Demos: Demo<typeof wiki1Schema>[] = [
  {
    language: 'en_US',
    data: {
      wiki1Content: JSON.stringify(englishDemo),
    },
  },
  {
    language: 'fr_FR',
    data: {
      wiki1Content: JSON.stringify(frenchDemo),
    },
  },
];
