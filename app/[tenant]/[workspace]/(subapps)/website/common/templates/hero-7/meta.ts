import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero7Schema = {
  title: 'Hero 7',
  code: 'hero7',
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
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
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
      defaultValue: 'wrapper bg-gradient-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 pt-md-15 pb-md-18',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero7Data = Data<typeof hero7Schema>;

export const hero7Demos: Demo<typeof hero7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-7',
    sequence: 1,
    data: {
      hero7Title: 'Inventive, sharp, and magnificent.',
      hero7Description:
        'We are a digital and mobile creative company with many honors, as we truly trust in the value of innovative thinking.',
      hero7ButtonLabel1: 'See Projects',
      hero7ButtonLabel2: 'Contact Us',
      hero7ButtonLink1: '#',
      hero7ButtonLink2: '#',
      hero7Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Benefits of choosing us',
          width: 793,
          height: 509,
          image: {
            id: '1',
            version: 1,
            fileName: 'i12.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i12.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-7',
    sequence: 1,
    data: {
      hero7Title: 'Inventif, pointu et magnifique.',
      hero7Description:
        'Nous sommes une entreprise de création numérique et mobile avec de nombreuses distinctions, car nous croyons vraiment en la valeur de la pensée innovante.',
      hero7ButtonLabel1: 'Voir les projets',
      hero7ButtonLabel2: 'Contactez-nous',
      hero7ButtonLink1: '#',
      hero7ButtonLink2: '#',
      hero7Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Benefits of choosing us',
          width: 793,
          height: 509,
          image: {
            id: '1',
            version: 1,
            fileName: 'i12.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/i12.png',
          },
        },
      },
    },
  },
];
