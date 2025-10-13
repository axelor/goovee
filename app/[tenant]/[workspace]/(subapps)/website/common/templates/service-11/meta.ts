import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {solidIconsSelection} from '../meta-selections';

export const service11Code = 'service11';

export const service11Schema = {
  title: 'Service 11',
  code: service11Code,
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
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service11Service',
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
      defaultValue: 'container mb-14 mb-md-20',
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
          selection: 'solid-icons',
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
    imageModel,
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service11Data = Data<typeof service11Schema>;

export const service11Demos: Demo<typeof service11Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-8',
    sequence: 4,
    data: {
      service11Caption: 'What We Provide?',
      service11Title:
        'The comprehensive service we provide is specifically tailored to your company’s requirements.',
      service11Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Our services',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
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
    site: 'fr',
    page: 'demo-8',
    sequence: 4,
    data: {
      service11Caption: 'Ce que nous offrons ?',
      service11Title:
        'Le service complet que nous fournissons est spécialement adapté aux besoins de votre entreprise.',
      service11Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Nos services',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
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
