import type {Model} from '../types/templates';

export const accordionModel = {
  name: 'Accordion',
  title: 'Accordions',
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'body',
      title: 'Body',
      type: 'string',
    },
    {
      name: 'expand',
      title: 'Expand',
      type: 'boolean',
    },
  ],
} as const satisfies Model;
