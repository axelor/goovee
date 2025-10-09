import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {uniconsSelection} from '../meta-selections';

export const service8Schema = {
  title: 'Service 8',
  code: 'service8',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage3',
      title: 'Tile Image 3',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage4',
      title: 'Tile Image 4',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
  ],
  metaModels: [metaFileModel],
  selections: [uniconsSelection],
} as const satisfies TemplateSchema;

export type Service8Data = Data<typeof service8Schema>;

export const service8Demos: Demo<typeof service8Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-13',
    sequence: 3,
    data: {
      service8Title: 'What We Provide?',
      service8Description:
        'We took pleasure in offering unique solutions to your particular needs.',
      service8TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa9.jpg',
        fileType: 'image/jpg',
        filePath: '/img/photos/sa9.jpg',
      },
      service8TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa10.jpg',
      },
      service8TileImage3: {
        id: '1',
        version: 1,
        fileName: 'sa11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa11.jpg',
      },
      service8TileImage4: {
        id: '1',
        version: 1,
        fileName: 'sa12.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa12.jpg',
      },
      service8Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'IoT Development',
            icon: 'circuit',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Artificial Intelligence',
            icon: 'processor',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Software Maintenance',
            icon: 'setting',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '4',
          version: 0,
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
    page: 'demo-13',
    sequence: 3,
    data: {
      service8Title: 'Ce que nous offrons ?',
      service8Description:
        'Nous avons pris plaisir à offrir des solutions uniques à vos besoins particuliers.',
      service8TileImage1: {
        id: '1',
        version: 1,
        fileName: 'sa9.jpg',
        fileType: 'image/jpg',
        filePath: '/img/photos/sa9.jpg',
      },
      service8TileImage2: {
        id: '1',
        version: 1,
        fileName: 'sa10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa10.jpg',
      },
      service8TileImage3: {
        id: '1',
        version: 1,
        fileName: 'sa11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa11.jpg',
      },
      service8TileImage4: {
        id: '1',
        version: 1,
        fileName: 'sa12.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa12.jpg',
      },
      service8Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Développement IoT',
            icon: 'circuit',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Intelligence artificielle',
            icon: 'processor',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Maintenance logicielle',
            icon: 'setting',
            description: 'Nulla vitae elit libero pharetra augue dapibus.',
            linkUrl: '#',
          },
        },
        {
          id: '4',
          version: 0,
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
