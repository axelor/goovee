import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing5Code = 'pricing5';

export const pricing5Schema = {
  title: 'Pricing 5',
  code: pricing5Code,
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
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'switchLeftLabel',
      title: 'Switch Left Label',
      type: 'string',
    },
    {
      name: 'switchRightLabel',
      title: 'Switch Right Label',
      type: 'string',
    },
    {
      name: 'plans',
      title: 'Plans',
      type: 'json-one-to-many',
      target: 'Plan',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-14 mb-md-18',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing5Data = Data<typeof pricing5Schema>;

export const pricing5Demos: Demo<typeof pricing5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-8',
    sequence: 9,
    data: {
      pricing5Title: 'We provide perfect and competitive prices.',
      pricing5Description:
        'Take advantage of our free 30-day trial to experience our full range of services',
      pricing5LinkTitle: 'See All Prices',
      pricing5ButtonLink: '#',
      pricing5ButtonText: 'See All Prices',
      pricing5SwitchLeftLabel: 'Monthly',
      pricing5SwitchRightLabel: 'Yearly (Save 30%)',
      pricing5Plans: [
        {
          attrs: {
            plan: 'Premium',
            price1: 25,
            price2: 199,
            buttonText: 'Choose Plan',
            buttonLink: '#',
            features: [
              {attrs: {label: '5 Projects'}},
              {attrs: {label: '100K API Access'}},
              {attrs: {label: '200MB Storage'}},
              {attrs: {label: 'Weekly Reports'}},
              {attrs: {label: '7/24 Support'}},
            ],
          },
        },
        {
          attrs: {
            plan: 'Corporate',
            price1: 54,
            price2: 499,
            buttonText: 'Choose Plan',
            buttonLink: '#',
            features: [
              {attrs: {label: '20 Projects'}},
              {attrs: {label: '300K API Access'}},
              {attrs: {label: '500MB Storage'}},
              {attrs: {label: 'Weekly Reports'}},
              {attrs: {label: '7/24 Support'}},
            ],
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-8',
    sequence: 9,
    data: {
      pricing5Title: 'Nous offrons des prix parfaits et compétitifs.',
      pricing5Description:
        'Profitez de notre essai gratuit de 30 jours pour découvrir notre gamme complète de services',
      pricing5LinkTitle: 'Voir tous les prix',
      pricing5ButtonLink: '#',
      pricing5ButtonText: 'Voir tous les prix',
      pricing5SwitchLeftLabel: 'Mensuel',
      pricing5SwitchRightLabel: 'Annuel (Économisez 30%)',
      pricing5Plans: [
        {
          attrs: {
            plan: 'Premium',
            price1: 25,
            price2: 199,
            buttonText: 'Choisir le plan',
            buttonLink: '#',
            features: [
              {attrs: {label: '5 projets'}},
              {attrs: {label: '100K accès API'}},
              {attrs: {label: '200 Mo de stockage'}},
              {attrs: {label: 'Rapports hebdomadaires'}},
              {attrs: {label: 'Assistance 7j/24'}},
            ],
          },
        },
        {
          attrs: {
            plan: 'Entreprise',
            price1: 54,
            price2: 499,
            buttonText: 'Choisir le plan',
            buttonLink: '#',
            features: [
              {attrs: {label: '20 projets'}},
              {attrs: {label: '300K accès API'}},
              {attrs: {label: '500 Mo de stockage'}},
              {attrs: {label: 'Rapports hebdomadaires'}},
              {attrs: {label: 'Assistance 7j/24'}},
            ],
          },
        },
      ],
    },
  },
];
