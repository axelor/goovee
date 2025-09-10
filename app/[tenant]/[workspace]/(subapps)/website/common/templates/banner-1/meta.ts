import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const banner1Schema = {
  title: 'Banner 1',
  code: 'banner1',
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
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
      name: 'button1',
      title: 'Button 1',
      type: 'string',
    },
    {
      name: 'button2',
      title: 'Button 2',
      type: 'string',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Banner1Data = Data<typeof banner1Schema>;

export const banner1Demos: Demo<typeof banner1Schema>[] = [
  {
    language: 'en_US',
    data: {
      banner1Heading:
        'Put your physical activity, rest, & medicine routine into one place.',
      banner1Title:
        'Lighthouse is currently accessible to download from the App Store as well as the Google Play Store.',
      banner1Image: {
        id: '1',
        version: 1,
        fileName: 'devices2.png',
        fileType: 'image/png',
        filePath: '/img/photos/devices2.png',
      },
      banner1Button1: 'Google Play',
      banner1Button2: 'App Store',
    },
  },
  {
    language: 'fr_FR',
    data: {
      banner1Heading:
        'Mettez votre activité physique, votre repos et votre routine médicale en un seul endroit.',
      banner1Title:
        'Lighthouse est actuellement accessible au téléchargement sur l’App Store ainsi que sur le Google Play Store.',
      banner1Image: {
        id: '1',
        version: 1,
        fileName: 'devices2.png',
        fileType: 'image/png',
        filePath: '/img/photos/devices2.png',
      },
      banner1Button1: 'Google Play',
      banner1Button2: 'App Store',
    },
  },
];
