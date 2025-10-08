import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const cta2Schema = {
  title: 'CTA 2',
  code: 'cta2',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'linkTitle1',
      title: 'Link Title 1',
      type: 'string',
    },
    {
      name: 'linkTitle2',
      title: 'Link Title 2',
      type: 'string',
    },
    {
      name: 'linkHref1',
      title: 'Link Href 1',
      type: 'string',
    },
    {
      name: 'linkHref2',
      title: 'Link Href 2',
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
      defaultValue: 'wrapper image-wrapper bg-auto bg-map text-center',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-0 pb-14 pt-md-18 pb-md-18 position-relative',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Cta2Data = Data<typeof cta2Schema>;

export const cta2Demos: Demo<typeof cta2Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-5',
    sequence: 7,
    data: {
      cta2Title: 'Trust us, join 10K+ clients to grow your business.',
      cta2LinkTitle1: 'Get Started',
      cta2LinkTitle2: 'Free Trial',
      cta2LinkHref1: '#',
      cta2LinkHref2: '#',
      cta2Image: {
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
    page: 'demo-5',
    sequence: 7,
    data: {
      cta2Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta2LinkTitle1: 'Commencer',
      cta2LinkTitle2: 'Essai gratuit',
      cta2LinkHref1: '#',
      cta2LinkHref2: '#',
      cta2Image: {
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
