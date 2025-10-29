import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero9Code = 'hero9';

export const hero9Schema = {
  title: 'Hero 9',
  code: hero9Code,
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
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'typewriter',
      title: 'Typewriter',
      type: 'json-one-to-many',
      target: 'Hero9Typewriter',
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
      defaultValue: 'container pt-10 pb-14 pb-lg-0',
    },
  ],
  models: [
    {
      name: 'Hero9Typewriter',
      title: 'Typewriter',
      fields: [
        {
          name: 'text',
          title: 'Text',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Hero9Data = Data<typeof hero9Schema>;

export const hero9Demos: Demo<typeof hero9Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-9',
    sequence: 1,
    data: {
      hero9Title: 'Lighthouse is simple and strong, with',
      hero9Description:
        'Meet your savings targets. Keep track of all of your recurrent & single-time expenses and revenue in one location.',
      hero9ButtonLabel1: 'Get Started',
      hero9ButtonLabel2: 'Free Trial',
      hero9ButtonLink1: '#',
      hero9ButtonLink2: '#',
      hero9Image: {
        attrs: {
          alt: 'Business process model',
          width: 665,
          height: 651,
          image: {
            fileName: 'sa16.png',
            fileType: 'image/png',
            filePath: '/img/photos/sa16.png',
          },
        },
      },
      hero9Typewriter: [
        {attrs: {text: 'quick transactions.'}},
        {attrs: {text: 'easy usage'}},
        {attrs: {text: 'secure payments'}},
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-9',
    sequence: 1,
    data: {
      hero9Title: 'Lighthouse est simple et solide, avec',
      hero9Description:
        'Atteignez vos objectifs d’épargne. Gardez une trace de toutes vos dépenses et revenus récurrents et ponctuels en un seul endroit.',
      hero9ButtonLabel1: 'Commencer',
      hero9ButtonLabel2: 'Essai gratuit',
      hero9ButtonLink1: '#',
      hero9ButtonLink2: '#',
      hero9Image: {
        attrs: {
          alt: 'Business process model',
          width: 665,
          height: 651,
          image: {
            fileName: 'sa16.png',
            fileType: 'image/png',
            filePath: '/img/photos/sa16.png',
          },
        },
      },
      hero9Typewriter: [
        {attrs: {text: 'transactions rapides.'}},
        {attrs: {text: 'utilisation facile'}},
        {attrs: {text: 'paiements sécurisés'}},
      ],
    },
  },
];
