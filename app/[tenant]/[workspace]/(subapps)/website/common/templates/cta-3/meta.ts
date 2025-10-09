import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const cta3Schema = {
  title: 'CTA 3',
  code: 'cta3',
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
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
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
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-auto no-overlay bg-image bg-map text-center mb-14 mb-md-16',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-md-18',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Cta3Data = Data<typeof cta3Schema>;

export const cta3Demos: Demo<typeof cta3Schema>[] = [
  {
    language: 'en_US',
    page: 'others',
    sequence: 5,
    data: {
      cta3Title: 'Explore Our Community',
      cta3Description:
        'Over 5000+ clients have placed their trust in us. <br /> Take advantage of our services to join them and elevate your business growth.',
      cta3LinkTitle: 'Join Us',
      cta3LinkHref: '#',
      cta3Image: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'others',
    sequence: 5,
    data: {
      cta3Title: 'Découvrez notre communauté',
      cta3Description:
        'Plus de 5000 clients nous ont fait confiance. <br /> Profitez de nos services pour les rejoindre et développer votre entreprise.',
      cta3LinkTitle: 'Rejoignez-nous',
      cta3LinkHref: '#',
      cta3Image: {
        id: '1',
        version: 1,
        fileName: 'map.png',
        fileType: 'image/png',
        filePath: '/img/map.png',
      },
    },
  },
];
