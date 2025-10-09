import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {serviceList3Model} from '../json-models';
import {buttonColorSelection} from '../meta-selections';

export const about21Schema = {
  title: 'About 21',
  code: 'about21',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'btnColor',
      title: 'Button Color',
      type: 'string',
      selection: 'button-colors',
    },
    {
      name: 'media',
      title: 'Media',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'hideShape',
      title: 'Hide Shape',
      type: 'boolean',
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
      defaultValue: 'container pt-15 pt-md-17 mb-15 mb-md-17',
    },
  ],
  models: [serviceList3Model],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection],
} as const satisfies TemplateSchema;

export type About21Data = Data<typeof about21Schema>;

export const about21Demos: Demo<typeof about21Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-20',
    sequence: 6,
    data: {
      about21Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      about21Caption: 'What Makes Us Different?',
      about21Description:
        'We provide ideas for creating the lives of our clients easier.',
      about21BtnColor: 'white',
      about21Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about21HideShape: true,
      about21AboutList: [
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
    page: 'demo-20',
    sequence: 6,
    data: {
      about21Image: {
        id: '1',
        version: 1,
        fileName: 'about11.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about11.jpg',
      },
      about21Caption: 'Qu’est-ce qui nous rend différents ?',
      about21Description:
        'Nous fournissons des idées pour faciliter la vie de nos clients.',
      about21BtnColor: 'white',
      about21Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about21HideShape: true,
      about21AboutList: [
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
