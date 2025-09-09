import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {startCase} from 'lodash-es';
import {linkColors} from '../../constants/colors';

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
          selection: solidIcons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
        },
        {
          name: 'linkType',
          title: 'Link Type',
          type: 'string',
          selection: linkColors.map(color => ({
            title: startCase(color),
            value: color,
          })),
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
} as const satisfies TemplateSchema;

export type Service21Data = Data<typeof service21Schema>;

export const service21Demos: Demo<typeof service21Schema>[] = [
  {
    language: 'en_US',
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
