import type {Model} from '../types/templates';
import {metaFileModel} from './meta-models';
import {
  colorsSelection,
  socialMediaUniconsSelection,
  solidIconsSelection,
} from './meta-selections';

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
      selection: 'colors',
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
  models: [bulletPointModel],
  selections: [colorsSelection],
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
      selection: 'colors',
    },
  ],
  selections: [colorsSelection],
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
      selection: 'solid-icons',
    },
  ],
  selections: [solidIconsSelection],
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
  metaModels: [metaFileModel],
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
      selection: 'social-media-unicons',
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
  selections: [socialMediaUniconsSelection],
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

export const planFeatureModel = {
  name: 'PlanFeature',
  title: 'Plan Feature',
  fields: [
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
      required: true,
    },
  ],
} as const satisfies Model;

export const planModel = {
  name: 'Plan',
  title: 'Plan',
  fields: [
    {
      name: 'plan',
      title: 'Plan',
      type: 'string',
      nameField: true,
      visibleInGrid: true,
    },
    {
      name: 'price1',
      title: 'Price 1',
      type: 'decimal',
      visibleInGrid: true,
    },
    {
      name: 'price2',
      title: 'Price 2',
      type: 'decimal',
      visibleInGrid: true,
    },
    {
      name: 'bulletBg',
      title: 'Bullet Background',
      type: 'boolean',
    },
    {
      name: 'roundedButton',
      title: 'Rounded Button',
      type: 'boolean',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'features',
      title: 'Features',
      type: 'json-one-to-many',
      target: 'PlanFeature',
    },
  ],
  models: [planFeatureModel],
} as const satisfies Model;

export const faq5QuestionsModel = {
  name: 'Faq5Questions',
  title: 'Questions',
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
  ],
} as const satisfies Model;
