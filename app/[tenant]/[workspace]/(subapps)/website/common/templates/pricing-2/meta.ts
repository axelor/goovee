import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planFeatureModel, planModel} from '../json-models';

export const pricing2Schema = {
  title: 'Pricing 2',
  code: 'pricing2',
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
  ],
  models: [planModel, planFeatureModel],
} as const satisfies TemplateSchema;

export type Pricing2Data = Data<typeof pricing2Schema>;

export const pricing2Demos: Demo<typeof pricing2Schema>[] = [
  {
    language: 'en_US',
    data: {
      pricing2Title: 'Our Pricing',
      pricing2Caption:
        'We offer great prices, premium products and quality service for your business.',
      pricing2SwitchLeftLabel: 'Monthly',
      pricing2SwitchRightLabel: 'Yearly',
      pricing2Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Basic Plan',
            price1: 9,
            price2: 99,
            buttonText: 'Choose Plan',
            buttonLink: '#',
            features: [
              {id: '1', version: 0, attrs: {label: '1 Project'}},
              {id: '2', version: 0, attrs: {label: '100K API Access'}},
              {id: '3', version: 0, attrs: {label: '100MB Storage'}},
              {id: '4', version: 0, attrs: {label: 'Weekly Reports'}},
              {id: '5', version: 0, attrs: {label: '7/24 Support'}},
            ],
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            plan: 'Premium Plan',
            price1: 19,
            price2: 199,
            buttonText: 'Choose Plan',
            buttonLink: '#',
            features: [
              {id: '1', version: 0, attrs: {label: '5 Projects'}},
              {id: '2', version: 0, attrs: {label: '100K API Access'}},
              {id: '3', version: 0, attrs: {label: '200MB Storage'}},
              {id: '4', version: 0, attrs: {label: 'Weekly Reports'}},
              {id: '5', version: 0, attrs: {label: '7/24 Support'}},
            ],
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            plan: 'Corporate Plan',
            price1: 49,
            price2: 499,
            buttonText: 'Choose Plan',
            buttonLink: '#',
            features: [
              {id: '1', version: 0, attrs: {label: '20 Projects'}},
              {id: '2', version: 0, attrs: {label: '300K API Access'}},
              {id: '3', version: 0, attrs: {label: '500MB Storage'}},
              {id: '4', version: 0, attrs: {label: 'Weekly Reports'}},
              {id: '5', version: 0, attrs: {label: '7/24 Support'}},
            ],
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      pricing2Title: 'Nos tarifs',
      pricing2Caption:
        'Nous offrons des prix avantageux, des produits haut de gamme et un service de qualité pour votre entreprise.',
      pricing2SwitchLeftLabel: 'Mensuel',
      pricing2SwitchRightLabel: 'Annuel',
      pricing2Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Plan de base',
            price1: 9,
            price2: 99,
            buttonText: 'Choisir le plan',
            buttonLink: '#',
            features: [
              {id: '1', version: 0, attrs: {label: '1 projet'}},
              {id: '2', version: 0, attrs: {label: '100K accès API'}},
              {id: '3', version: 0, attrs: {label: '100 Mo de stockage'}},
              {id: '4', version: 0, attrs: {label: 'Rapports hebdomadaires'}},
              {id: '5', version: 0, attrs: {label: 'Assistance 7j/24'}},
            ],
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            plan: 'Plan Premium',
            price1: 19,
            price2: 199,
            buttonText: 'Choisir le plan',
            buttonLink: '#',
            features: [
              {id: '1', version: 0, attrs: {label: '5 projets'}},
              {id: '2', version: 0, attrs: {label: '100K accès API'}},
              {id: '3', version: 0, attrs: {label: '200 Mo de stockage'}},
              {id: '4', version: 0, attrs: {label: 'Rapports hebdomadaires'}},
              {id: '5', version: 0, attrs: {label: 'Assistance 7j/24'}},
            ],
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            plan: "Plan d'entreprise",
            buttonText: 'Choisir le plan',
            buttonLink: '#',
            price1: 49,
            price2: 499,
            features: [
              {id: '1', version: 0, attrs: {label: '20 projets'}},
              {id: '2', version: 0, attrs: {label: '300K accès API'}},
              {id: '3', version: 0, attrs: {label: '500 Mo de stockage'}},
              {id: '4', version: 0, attrs: {label: 'Rapports hebdomadaires'}},
              {id: '5', version: 0, attrs: {label: 'Assistance 7j/24'}},
            ],
          },
        },
      ],
    },
  },
];
