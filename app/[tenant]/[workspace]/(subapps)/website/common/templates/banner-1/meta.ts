import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const banner1Code = 'banner1';

export const banner1Schema = {
  title: 'Banner 1',
  code: banner1Code,
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
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
      defaultValue: 'container pt-5 pb-15 pt-lg-10 pb-lg-2',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Banner1Data = Data<typeof banner1Schema>;

export const banner1Demos: Demo<typeof banner1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-6',
    sequence: 6,
    data: {
      banner1Heading:
        'Put your physical activity, rest, & medicine routine into one place.',
      banner1Title:
        'Lighthouse is currently accessible to download from the App Store as well as the Google Play Store.',
      banner1Image: {
        attrs: {
          alt: 'Lighthouse app on mobile devices',
          width: 740,
          height: 726,
          image: {
            fileName: 'devices2.png',
            fileType: 'image/png',
            filePath: '/img/photos/devices2.png',
          },
        },
      },
      banner1Button1: 'Google Play',
      banner1Button2: 'App Store',
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-6',
    sequence: 6,
    data: {
      banner1Heading:
        'Mettez votre activité physique, votre repos et votre routine médicale en un seul endroit.',
      banner1Title:
        'Lighthouse est actuellement accessible au téléchargement sur l’App Store ainsi que sur le Google Play Store.',
      banner1Image: {
        attrs: {
          alt: 'Application Lighthouse sur appareils mobiles',
          width: 740,
          height: 726,
          image: {
            fileName: 'devices2.png',
            fileType: 'image/png',
            filePath: '/img/photos/devices2.png',
          },
        },
      },
      banner1Button1: 'Google Play',
      banner1Button2: 'App Store',
    },
  },
];
