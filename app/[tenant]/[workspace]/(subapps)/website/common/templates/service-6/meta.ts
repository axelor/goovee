import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, bulletPointModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const service6Schema = {
  title: 'Service 6',
  code: 'service6',
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
      name: 'image1',
      title: 'Image 1',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image3',
      title: 'Image 3',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'serviceList',
      title: 'Service List',
      type: 'json-many-to-one',
      target: 'BulletList',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [bulletListModel, bulletPointModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service6Data = Data<typeof service6Schema>;

export const service6Demos: Demo<typeof service6Schema>[] = [
  {
    language: 'en_US',
    data: {
      service6Title:
        'The service we offer is specifically designed to meet your needs.',
      service6Description:
        'We have a landscape-oriented flyer design that will help you reach a wider audience and increase your sales.',
      service6Image1: {
        id: '1',
        version: 1,
        fileName: 'sa13.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa13.jpg',
      },
      service6Image2: {
        id: '1',
        version: 1,
        fileName: 'sa14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa14.jpg',
      },
      service6Image3: {
        id: '1',
        version: 1,
        fileName: 'sa15.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa15.jpg',
      },
      service6ServiceList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      service6Title:
        'Le service que nous proposons est spécialement conçu pour répondre à vos besoins.',
      service6Description:
        'Nous avons un modèle de flyer orienté paysage qui vous aidera à toucher un public plus large et à augmenter vos ventes.',
      service6Image1: {
        id: '1',
        version: 1,
        fileName: 'sa13.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa13.jpg',
      },
      service6Image2: {
        id: '1',
        version: 1,
        fileName: 'sa14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa14.jpg',
      },
      service6Image3: {
        id: '1',
        version: 1,
        fileName: 'sa15.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/sa15.jpg',
      },
      service6ServiceList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Aenean quam ornare curabitur blandit consectetur.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare aenean leo.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Etiam porta euismod malesuada mollis nisl ornare.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Vivamus sagittis lacus augue rutrum maecenas odio.',
              },
            },
          ],
        },
      },
    },
  },
];
