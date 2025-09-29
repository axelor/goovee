import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {serviceList3Model} from '../json-models';

export const about20Schema = {
  title: 'About 20',
  code: 'about20',
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
      name: 'aboutList',
      title: 'About List',
      type: 'json-one-to-many',
      target: 'ServiceList3',
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
      defaultValue: 'container mt-15 pb-16 pb-md-18',
    },
  ],
  models: [serviceList3Model],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About20Data = Data<typeof about20Schema>;

export const about20Demos: Demo<typeof about20Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-19',
    sequence: 7,
    data: {
      about20Image1: {
        id: '1',
        version: 1,
        fileName: 'g8.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g8.jpg',
      },
      about20Image2: {
        id: '1',
        version: 1,
        fileName: 'g9.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g9.jpg',
      },
      about20Image3: {
        id: '1',
        version: 1,
        fileName: 'g10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g10.jpg',
      },
      about20Caption: 'What Makes Us Different?',
      about20Description:
        'We provide ideas for creating the lives of our clients easier.',
      about20AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Secure Payment',
            description: 'Curabitur blandit lacus porttitor riduculus mus.',
            icon: 'Shield',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Daily Update',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'DevicesTwo',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'AI Design',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'AI',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Trendy Product',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'Rocket',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-19',
    sequence: 7,
    data: {
      about20Image1: {
        id: '1',
        version: 1,
        fileName: 'g8.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g8.jpg',
      },
      about20Image2: {
        id: '1',
        version: 1,
        fileName: 'g9.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g9.jpg',
      },
      about20Image3: {
        id: '1',
        version: 1,
        fileName: 'g10.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/g10.jpg',
      },
      about20Caption: 'Qu’est-ce qui nous rend différents ?',
      about20Description:
        'Nous fournissons des idées pour faciliter la vie de nos clients.',
      about20AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Paiement sécurisé',
            description: 'Curabitur blandit lacus porttitor riduculus mus.',
            icon: 'Shield',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Mise à jour quotidienne',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'DevicesTwo',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Conception IA',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'AI',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Produit tendance',
            description: 'Curabitur blandit lacus porttitor ridiculus mus.',
            icon: 'Rocket',
          },
        },
      ],
    },
  },
];
