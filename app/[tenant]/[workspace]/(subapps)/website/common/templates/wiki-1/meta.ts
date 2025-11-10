import {
  Template,
  Data,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {
  formatComponentCode,
  formatCustomFieldName,
} from '@/subapps/website/common/utils/helper';

const contentFieldName = 'content' as const;
export const wiki1Code = 'wiki1';

export const wiki1Schema = {
  title: 'Wiki 1',
  code: wiki1Code,
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
  return formatCustomFieldName(contentFieldName, getWikiComponentCode());
}

export function getWikiComponentCode() {
  return formatComponentCode(wiki1Code);
}

export type Wiki1Data = Data<typeof wiki1Schema>;
