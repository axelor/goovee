import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const portfolio1Schema = {
  title: 'Portfolio 1',
  code: 'portfolio1',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'images',
      title: 'Images',
      type: 'json-one-to-many',
      target: 'Portfolio1Images',
    },
  ],
  models: [
    {
      name: 'Portfolio1Images',
      title: 'Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio1Data = Data<typeof portfolio1Schema>;

export const portfolio1Demos: Demo<typeof portfolio1Schema>[] = [
  {
    language: 'en_US',
    data: {
      portfolio1Caption: 'Latest Projects',
      portfolio1Description:
        'Check out some of our awesome projects with creative ideas and great design.',
      portfolio1Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Project 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp10.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Project 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp11.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Project 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp12.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Project 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp10.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Project 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp11.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Project 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp12.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      portfolio1Caption: 'Derniers projets',
      portfolio1Description:
        'Découvrez quelques-uns de nos superbes projets avec des idées créatives et un superbe design.',
      portfolio1Images: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Projet 1',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp10.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'Projet 2',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp11.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'Projet 3',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp12.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            name: 'Projet 4',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp10.jpg',
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Projet 5',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp11.jpg',
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            name: 'Projet 6',
            image: {
              id: '1',
              version: 1,
              fileName: 'pp12.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pp12.jpg',
            },
          },
        },
      ],
    },
  },
];
