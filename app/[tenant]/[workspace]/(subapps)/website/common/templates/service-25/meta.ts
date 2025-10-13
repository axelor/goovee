import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {
  uniconsSelection,
  colorsSelection,
  linkColorsSelection,
} from '../meta-selections';

export const service25Code = 'service25';

export const service25Schema = {
  title: 'Service 25',
  code: service25Code,
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service25Service',
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
      defaultValue: 'container pt-14 pt-md-16',
    },
  ],
  models: [
    {
      name: 'Service25Service',
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
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'unicons',
        },
        {
          name: 'iconColor',
          title: 'Icon Color',
          type: 'string',
          selection: 'colors',
        },
        {
          name: 'linkUrl',
          title: 'Link Url',
          type: 'string',
        },
        {
          name: 'linkColor',
          title: 'Link Color',
          type: 'string',
          selection: 'link-colors',
        },
      ],
    },
  ],
  selections: [uniconsSelection, colorsSelection, linkColorsSelection],
} as const satisfies TemplateSchema;

export type Service25Data = Data<typeof service25Schema>;

export const service25Demos: Demo<typeof service25Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-22',
    sequence: 2,
    data: {
      service25Caption: 'What We Do?',
      service25Title:
        'We took pleasure in offering unique solutions to your particular needs.',
      service25Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Web Design',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget. Fusce dapibus tellus.',
            icon: 'monitor',
            iconColor: 'soft-purple',
            linkColor: 'purple',
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Graphic Design',
            description:
              'Maecenas faucibus mollis interdum. Vivamus sagittis lacus vel augue laoreet. Sed posuere consectetur.',
            icon: 'swatchbook',
            iconColor: 'soft-green',
            linkColor: 'green',
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: '3D Animation',
            description:
              'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Praesent commodo cursus magna scelerisque.',
            icon: 'presentation-play',
            iconColor: 'soft-pink',
            linkColor: 'pink',
            linkUrl: '#',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-22',
    sequence: 2,
    data: {
      service25Caption: 'Que faisons-nous ?',
      service25Title:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service25Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Conception de sites Web',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida at eget. Fusce dapibus tellus.',
            icon: 'monitor',
            iconColor: 'soft-purple',
            linkColor: 'purple',
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Conception graphique',
            description:
              'Maecenas faucibus mollis interdum. Vivamus sagittis lacus vel augue laoreet. Sed posuere consectetur.',
            icon: 'swatchbook',
            iconColor: 'soft-green',
            linkColor: 'green',
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Animation 3D',
            description:
              'Cras justo odio, dapibus ac facilisis in, egestas eget quam. Praesent commodo cursus magna scelerisque.',
            icon: 'presentation-play',
            iconColor: 'soft-pink',
            linkColor: 'pink',
            linkUrl: '#',
          },
        },
      ],
    },
  },
];
