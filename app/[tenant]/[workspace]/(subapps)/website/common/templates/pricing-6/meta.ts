import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing6Code = 'pricing6';

export const pricing6Schema = {
  title: 'Pricing 6',
  code: pricing6Code,
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
      defaultValue: 'container pb-14 pb-md-17',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing6Data = Data<typeof pricing6Schema>;

export const pricing6Demos: Demo<typeof pricing6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-9',
    sequence: 6,
    data: {
      pricing6Title: 'Our Pricing',
      pricing6Caption: 'We provide perfect and competitive prices.',
      pricing6Description:
        'Take advantage of our free 30-day trial to experience our full range of services',
      pricing6LinkTitle: 'See All Prices',
      pricing6ButtonLink: '#',
      pricing6ButtonText: 'See All Prices',
      pricing6SwitchLeftLabel: 'Monthly',
      pricing6SwitchRightLabel: 'Yearly (Save 30%)',
      pricing6Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Premium',
            price1: 25,
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
          id: '2',
          version: 0,
          attrs: {
            plan: 'Corporate',
            price1: 54,
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
    site: 'fr',
    page: 'demo-9',
    sequence: 6,
    data: {
      pricing6Title: 'Nos tarifs',
      pricing6Caption: 'Nous offrons des prix parfaits et compétitifs.',
      pricing6Description:
        'Profitez de notre essai gratuit de 30 jours pour découvrir notre gamme complète de services',
      pricing6LinkTitle: 'Voir tous les prix',
      pricing6ButtonLink: '#',
      pricing6ButtonText: 'Voir tous les prix',
      pricing6SwitchLeftLabel: 'Mensuel',
      pricing6SwitchRightLabel: 'Annuel (Économisez 30%)',
      pricing6Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Premium',
            price1: 25,
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
          id: '2',
          version: 0,
          attrs: {
            plan: 'Entreprise',
            price1: 54,
            price2: 499,
            buttonText: 'Choisir le plan',
            buttonLink: '#',
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
