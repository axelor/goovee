import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection, linkColorsSelection} from '../meta-selections';

export const service16Schema = {
  title: 'Service 16',
  code: 'service16',
  type: Template.block,
  fields: [
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service16Service',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16 mt-n18 mt-md-n21',
    },
  ],
  models: [
    {
      name: 'Service16Service',
      title: 'Service',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'link',
          title: 'Link',
          type: 'string',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
        {
          name: 'linkType',
          title: 'Link Type',
          type: 'string',
          selection: 'link-colors',
        },
        {
          name: 'iconClassName',
          title: 'Icon Class Name',
          type: 'string',
        },
        {
          name: 'cardClassName',
          title: 'Card Class Name',
          type: 'string',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
  selections: [solidIconsSelection, linkColorsSelection],
} as const satisfies TemplateSchema;

export type Service16Data = Data<typeof service16Schema>;

export const service16Demos: Demo<typeof service16Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-12',
    sequence: 2,
    data: {
      service16Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Megaphone',
            title: 'Content Marketing',
            linkType: 'yellow',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '#',
            icon: 'ThumbsUp',
            title: 'Social Engagement',
            linkType: 'green',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '#',
            icon: 'IdCard',
            linkType: 'orange',
            title: 'Identity & Branding',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Box',
            linkType: 'blue',
            title: 'Product Design',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-12',
    sequence: 2,
    data: {
      service16Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Megaphone',
            title: 'Marketing de contenu',
            linkType: 'yellow',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '#',
            icon: 'ThumbsUp',
            title: 'Engagement social',
            linkType: 'green',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '#',
            icon: 'IdCard',
            linkType: 'orange',
            title: 'Identité et image de marque',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Box',
            linkType: 'blue',
            title: 'Conception de produits',
            iconClassName: 'icon-svg-md text-orange mb-3',
            cardClassName: 'card-border-bottom border-soft-yellow',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
      ],
    },
  },
];
