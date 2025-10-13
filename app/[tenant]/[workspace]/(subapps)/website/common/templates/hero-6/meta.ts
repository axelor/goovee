import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero6Code = 'hero6';

export const hero6Schema = {
  title: 'Hero 6',
  code: hero6Code,
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
      name: 'appStoreTitle',
      title: 'App Store Title',
      type: 'string',
    },
    {
      name: 'appStoreUrl',
      title: 'App Store URL',
      type: 'string',
    },
    {
      name: 'googlePlayTitle',
      title: 'Google Play Title',
      type: 'string',
    },
    {
      name: 'googlePlayUrl',
      title: 'Google Play URL',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-10',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero6Data = Data<typeof hero6Schema>;

export const hero6Demos: Demo<typeof hero6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-6',
    sequence: 1,
    data: {
      hero6Title:
        'Put your physical activity, rest, and medicine routine into one place.',
      hero6Description:
        'Lighthouse is currently accessible to download from the App Store as well as the Google Play Store.',
      hero6AppStoreTitle: 'App Store',
      hero6AppStoreUrl: '#',
      hero6GooglePlayTitle: 'Google Play',
      hero6GooglePlayUrl: '#',
      hero6Image: {
        id: '1',
        version: 1,
        attrs: {
          alt: 'Devices',
          width: 830,
          height: 895,
          image: {
            id: '1',
            version: 1,
            fileName: 'devices.png',
            fileType: 'image/png',
            filePath: '/img/photos/devices.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-6',
    sequence: 1,
    data: {
      hero6Title:
        'Regroupez votre activité physique, votre repos et votre routine médicale en un seul endroit.',
      hero6Description:
        'Lighthouse est actuellement accessible en téléchargement sur l’App Store ainsi que sur le Google Play Store.',
      hero6AppStoreTitle: 'App Store',
      hero6AppStoreUrl: '#',
      hero6GooglePlayTitle: 'Google Play',
      hero6GooglePlayUrl: '#',
      hero6Image: {
        id: '1',
        version: 1,
        attrs: {
          alt: 'Devices',
          width: 830,
          height: 895,
          image: {
            id: '1',
            version: 1,
            fileName: 'devices.png',
            fileType: 'image/png',
            filePath: '/img/photos/devices.png',
          },
        },
      },
    },
  },
];
