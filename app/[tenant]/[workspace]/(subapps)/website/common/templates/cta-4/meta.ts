import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const cta4Code = 'cta4';

export const cta4Schema = {
  title: 'CTA 4',
  code: cta4Code,
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
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-18',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Cta4Data = Data<typeof cta4Schema>;

export const cta4Demos: Demo<typeof cta4Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-3',
    sequence: 5,
    data: {
      cta4Title: 'Trust us, join 10K+ clients to grow your business.',
      cta4Caption: 'Join Our Community',
      cta4LinkTitle: 'Join Us',
      cta4LinkHref: '#',
      cta4Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Join our community',
          width: 1500,
          height: 1000,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg9.jpg',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-3',
    sequence: 5,
    data: {
      cta4Title:
        'Faites-nous confiance, rejoignez plus de 10 000 clients pour développer votre entreprise.',
      cta4Caption: 'Rejoignez notre communauté',
      cta4LinkTitle: 'Rejoignez-nous',
      cta4LinkHref: '#',
      cta4Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Rejoignez notre communauté',
          width: 1500,
          height: 1000,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg9.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg9.jpg',
          },
        },
      },
    },
  },
];
