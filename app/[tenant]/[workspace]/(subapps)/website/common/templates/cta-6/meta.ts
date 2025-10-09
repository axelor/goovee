import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const cta6Schema = {
  title: 'CTA 6',
  code: 'cta6',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
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
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-auto no-overlay bg-image bg-map text-center',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-md-16 py-lg-18',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Cta6Data = Data<typeof cta6Schema>;

export const cta6Demos: Demo<typeof cta6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 8,
    data: {
      cta6Title: 'Trust us, join 10K+ clients to grow your business.',
      cta6LinkTitle: 'Get Started',
      cta6LinkHref: '#',
      cta6Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'World map background',
          width: 800,
          height: 484,
          image: {
            id: '1',
            version: 1,
            fileName: 'map.png',
            fileType: 'image/png',
            filePath: '/img/map.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-17',
    sequence: 8,
    data: {
      cta6Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta6LinkTitle: 'Commencer',
      cta6LinkHref: '#',
      cta6Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Fond de carte du monde',
          width: 800,
          height: 484,
          image: {
            id: '1',
            version: 1,
            fileName: 'map.png',
            fileType: 'image/png',
            filePath: '/img/map.png',
          },
        },
      },
    },
  },
];
