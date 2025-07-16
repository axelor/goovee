import {Data, Demo, Meta} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';

export const hero1Meta = {
  title: 'Hero 1',
  code: 'hero1',
  type: 1,
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
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
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
} as const satisfies Meta;

export type Hero1Data = Data<typeof hero1Meta>;

export const hero1Demos: Demo<typeof hero1Meta>[] = [
  {
    language: 'en_US',
    data: {
      hero1Title: 'Expand Your Business with Our Solutions.',
      hero1Description:
        "Boost your website's traffic, rankings, and online visibility  with our services.",
      hero1ButtonText: 'Try It For Free',
      hero1ButtonLink: '#',
      hero1Image: {
        id: '1',
        version: 1,
        fileName: 'i2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i2.png',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero1Title: 'Développez votre entreprise avec nos solutions.',
      hero1Description:
        'Augmentez le trafic, le classement et la visibilité en ligne de votre site web grâce à nos services.',
      hero1ButtonText: 'Essayez-le gratuitement',
      hero1ButtonLink: '#',
      hero1Image: {
        id: '1',
        version: 1,
        fileName: 'i2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i2.png',
      },
    },
  },
];
