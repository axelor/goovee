import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing2Code = 'pricing2';

export const pricing2Schema = {
  title: 'Pricing 2',
  code: pricing2Code,
  type: Template.block,
  fields: [
    {
      name: 'switchLeftLabel',
      title: 'Switch Left Label',
      type: 'string',
    },
    {
      name: 'switchRightLabel',
      title: 'Switch Right Label',
      type: 'string',
    },
    {
      name: 'plans',
      title: 'Plans',
      type: 'json-one-to-many',
      target: 'Plan',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'pricing-wrapper position-relative',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing2Data = Data<typeof pricing2Schema>;

export const pricing2Demos: Demo<typeof pricing2Schema>[] = [];
