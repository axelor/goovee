import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {uniconsSelection} from '../meta-selections';

export const service8Code = 'service8';

export const service8Schema = {
  title: 'Service 8',
  code: service8Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'tileImage1',
      title: 'Tile Image 1',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'tileImage3',
      title: 'Tile Image 3',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'tileImage4',
      title: 'Tile Image 4',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service8Service',
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
      defaultValue: 'container mt-5 mt-md-12 mt-lg-0 mb-15',
    },
  ],
  models: [
    {
      name: 'Service8Service',
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
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'unicons',
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'linkUrl',
          title: 'Link Url',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
  selections: [uniconsSelection],
} as const satisfies TemplateSchema;

export type Service8Data = Data<typeof service8Schema>;

export const service8Demos: Demo<typeof service8Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-13',
    sequence: 3,
    data: {
      service8Title: 'What We Provide?',
      service8Description:
        'We took pleasure in offering unique solutions to your particular needs.',
      service8TileImage1: {
        attrs: {
          alt: 'demo',
          width: 223,
          height: 187,
          image: {
            fileName: 'sa9.jpg',
            fileType: 'image/jpg',
            filePath: '/img/photos/sa9.jpg',
          },
        },
      },
      service8TileImage2: {
        attrs: {
          alt: 'demo',
          width: 187,
          height: 217,
          image: {
            fileName: 'sa10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa10.jpg',
          },
        },
      },
      service8TileImage3: {
        attrs: {
          alt: 'demo',
          width: 321,
          height: 116,
          image: {
            fileName: 'sa11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa11.jpg',
          },
        },
      },
      service8TileImage4: {
        attrs: {
          alt: 'demo',
          width: 294,
          height: 383,
          image: {
            fileName: 'sa12.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa12.jpg',
          },
        },
      },
      service8Services: [
        {
          attrs: {
            title: 'IoT Development',
            icon: 'circuit',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Artificial Intelligence',
            icon: 'processor',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Software Maintenance',
            icon: 'setting',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Cybersecurity',
            icon: 'lock-access',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-13',
    sequence: 3,
    data: {
      service8Title: 'Ce que nous offrons ?',
      service8Description:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service8TileImage1: {
        attrs: {
          alt: 'démo',
          width: 223,
          height: 187,
          image: {
            fileName: 'sa9.jpg',
            fileType: 'image/jpg',
            filePath: '/img/photos/sa9.jpg',
          },
        },
      },
      service8TileImage2: {
        attrs: {
          alt: 'démo',
          width: 187,
          height: 217,
          image: {
            fileName: 'sa10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa10.jpg',
          },
        },
      },
      service8TileImage3: {
        attrs: {
          alt: 'démo',
          width: 321,
          height: 116,
          image: {
            fileName: 'sa11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa11.jpg',
          },
        },
      },
      service8TileImage4: {
        attrs: {
          alt: 'démo',
          width: 294,
          height: 383,
          image: {
            fileName: 'sa12.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/sa12.jpg',
          },
        },
      },
      service8Services: [
        {
          attrs: {
            title: 'Développement IoT',
            icon: 'circuit',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Intelligence artificielle',
            icon: 'processor',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Maintenance logicielle',
            icon: 'setting',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          attrs: {
            title: 'Cybersécurité',
            icon: 'lock-access',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
      ],
    },
  },
];
