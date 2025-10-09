import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIconsSelection, linkColorsSelection} from '../meta-selections';

export const service21Schema = {
  title: 'Service 21',
  code: 'service21',
  type: Template.block,
  fields: [
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service21Service',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mt-n19 mb-14 mb-md-17',
    },
  ],
  models: [
    {
      name: 'Service21Service',
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
  selections: [solidIconsSelection, linkColorsSelection],
} as const satisfies TemplateSchema;

export type Service21Data = Data<typeof service21Schema>;

export const service21Demos: Demo<typeof service21Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-19',
    sequence: 2,
    data: {
      service21Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Rocket',
            title: 'DevOps',
            linkType: 'fuchsia',
            iconClassName: 'icon-svg-sm solid-mono text-fuchsia mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Code',
            title: 'Development',
            linkType: 'violet',
            iconClassName: 'icon-svg-sm solid-mono text-violet mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '#',
            icon: 'DevicesTwo',
            linkType: 'orange',
            title: 'App Development',
            iconClassName: 'icon-svg-sm solid-mono text-orange mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Hand',
            title: 'Support',
            linkType: 'green',
            iconClassName: 'icon-svg-sm solid-mono text-green mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-19',
    sequence: 2,
    data: {
      service21Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Rocket',
            title: 'DevOps',
            linkType: 'fuchsia',
            iconClassName: 'icon-svg-sm solid-mono text-fuchsia mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Code',
            title: 'Développement',
            linkType: 'violet',
            iconClassName: 'icon-svg-sm solid-mono text-violet mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            link: '#',
            icon: 'DevicesTwo',
            linkType: 'orange',
            title: 'Développement d’applications',
            iconClassName: 'icon-svg-sm solid-mono text-orange mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            link: '#',
            icon: 'Hand',
            title: 'Support',
            linkType: 'green',
            iconClassName: 'icon-svg-sm solid-mono text-green mb-3',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget metus cras justo.',
          },
        },
      ],
    },
  },
];
