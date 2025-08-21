import {startCase} from 'lodash-es';
import {colors} from '../constants/colors';
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

export const bulletListModel = {
  name: 'BulletList',
  title: 'Bullet List',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'bulletColor',
      title: 'Bullet Color',
      type: 'string',
      selection: colors.map(color => ({title: startCase(color), value: color})),
    },
    {
      name: 'rowClass',
      title: 'Row Class',
      type: 'string',
    },
    {
      name: 'list',
      title: 'List',
      type: 'json-one-to-many',
      target: 'BulletPoint',
    },
  ],
} as const satisfies Model;

export const bulletPointModel = {
  name: 'BulletPoint',
  title: 'Bullet Point',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
  ],
} as const satisfies Model;
