import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {startCase} from 'lodash-es';

export const service11Schema = {
  title: 'Service 11',
  code: 'service11',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service11Service',
    },
  ],
  models: [
    {
      name: 'Service11Service',
      title: 'Service',
      fields: [
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
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service11Data = Data<typeof service11Schema>;

export const service11Demos: Demo<typeof service11Schema>[] = [
  {
    language: 'en_US',
    data: {
      service11Caption: 'What We Provide?',
      service11Title:
        'The comprehensive service we provide is specifically tailored to your company’s requirements.',
      service11Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      service11Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'DevicesThree',
            title: 'IoT Development',
            description:
              'IoT development, devices are connected to the internet',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'AI',
            title: 'Artificial Intelligence',
            description:
              'IoT development, devices are connected to the internet',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Software Maintenance',
            description:
              'IoT development, devices are connected to the internet',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Cart',
            title: 'E-commerce Solutions',
            description:
              'IoT development, devices are connected to the internet',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service11Caption: 'Ce que nous offrons ?',
      service11Title:
        'Le service complet que nous fournissons est spécialement adapté aux besoins de votre entreprise.',
      service11Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      service11Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'DevicesThree',
            title: 'Développement IoT',
            description:
              'Développement IoT, les appareils sont connectés à Internet',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'AI',
            title: 'Intelligence artificielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Setting',
            title: 'Maintenance logicielle',
            description:
              'Développement IoT, les appareils sont connectés à Internet',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            icon: 'Cart',
            title: 'Solutions de commerce électronique',
            description:
              'Développement IoT, les appareils sont connectés à Internet',
          },
        },
      ],
    },
  },
];
