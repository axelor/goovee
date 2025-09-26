import {startCase} from 'lodash-es';
import {colors} from '../constants/colors';
import type {Model} from '../types/templates';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {socialMediaUnicons} from '../constants/unicons';

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

export const progressListModel = {
  name: 'ProgressList',
  title: 'Progress List',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'percent',
      title: 'Percent',
      type: 'integer',
    },
    {
      name: 'color',
      title: 'Color',
      type: 'string',
      selection: colors.map(color => ({
        title: startCase(color),
        value: color,
      })),
    },
  ],
} as const satisfies Model;

export const serviceList3Model = {
  name: 'ServiceList3',
  title: 'Service List',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string',
      selection: solidIcons.map(icon => ({
        title: startCase(icon),
        value: icon,
      })),
    },
  ],
} as const satisfies Model;

export const clientsModel = {
  name: 'Clients',
  title: 'Clients',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
} as const satisfies Model;

export const socialLinksModel = {
  name: 'SocialLinks',
  title: 'Social Links',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'icon',
      title: 'Icon',
      type: 'string',
      selection: socialMediaUnicons.map(icon => ({
        title: startCase(icon),
        value: icon,
      })),
      visibleInGrid: true,
      required: true,
    },
    {
      name: 'url',
      title: 'Url',
      type: 'string',
      required: true,
    },
  ],
} as const satisfies Model;

export const contactInfoModel = {
  name: 'ContactInfo',
  title: 'Contact Info',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      visibleInGrid: true,
      nameField: true,
    },
    {
      name: 'addressTitle',
      title: 'Address Title',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'string',
    },
    {
      name: 'phoneTitle',
      title: 'Phone Title',
      type: 'string',
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
    },
    {
      name: 'emailTitle',
      title: 'Email Title',
      type: 'string',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      widget: 'Email',
    },
  ],
} as const satisfies Model;
