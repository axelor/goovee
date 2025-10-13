import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const cta8Code = 'cta8';

export const cta8Schema = {
  title: 'CTA 8',
  code: cta8Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
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
      defaultValue: 'wrapper mb-14',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container card image-wrapper overflow-hidden',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Cta8Data = Data<typeof cta8Schema>;

export const cta8Demos: Demo<typeof cta8Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-19',
    sequence: 8,
    data: {
      cta8Title: 'Trust us, join 10K+ clients to grow your business.',
      cta8Caption: 'Join Our Community',
      cta8LinkTitle: 'Get Started',
      cta8LinkHref: '#',
      cta8Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Join our community',
          width: 1440,
          height: 674,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg16.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg16.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-19',
    sequence: 8,
    data: {
      cta8Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta8Caption: 'Rejoignez notre communauté',
      cta8LinkTitle: 'Commencer',
      cta8LinkHref: '#',
      cta8Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Rejoignez notre communauté',
          width: 1440,
          height: 674,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg16.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg16.png',
          },
        },
      },
    },
  },
];
