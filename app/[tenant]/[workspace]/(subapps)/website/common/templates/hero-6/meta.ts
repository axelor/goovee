import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero6Schema = {
  title: 'Hero 6',
  code: 'hero6',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero6Data = Data<typeof hero6Schema>;

export const hero6Demos: Demo<typeof hero6Schema>[] = [
  {
    language: 'en_US',
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
        fileName: 'devices.png',
        fileType: 'image/png',
        filePath: '/img/photos/devices.png',
      },
    },
  },
  {
    language: 'fr_FR',
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
        fileName: 'devices.png',
        fileType: 'image/png',
        filePath: '/img/photos/devices.png',
      },
    },
  },
];
