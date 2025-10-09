import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing3Schema = {
  title: 'Pricing 3',
  code: 'pricing3',
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
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
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
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-16 mb-md-18',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing3Data = Data<typeof pricing3Schema>;

export const pricing3Demos: Demo<typeof pricing3Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-3',
    sequence: 9,
    data: {
      pricing3Title: 'Our Pricing',
      pricing3Caption: 'We provide perfect and competitive prices.',
      pricing3Description:
        'Take advantage of our free 30-day trial to experience our full range of services',
      pricing3SwitchLeftLabel: 'Monthly',
      pricing3SwitchRightLabel: 'Yearly (Save 30%)',
      pricing3ButtonLabel: 'See All Prices',
      pricing3ButtonLink: '#',
      pricing3Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Premium',
            price1: 25,
            price2: 199,
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
    page: 'demo-3',
    sequence: 9,
    data: {
      pricing3Title: 'Nos tarifs',
      pricing3Caption: 'Nous offrons des prix parfaits et compétitifs.',
      pricing3Description:
        'Profitez de notre essai gratuit de 30 jours pour découvrir notre gamme complète de services',
      pricing3SwitchLeftLabel: 'Mensuel',
      pricing3SwitchRightLabel: 'Annuel (Économisez 30%)',
      pricing3ButtonLabel: 'Voir tous les prix',
      pricing3ButtonLink: '#',
      pricing3Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Premium',
            price1: 25,
            price2: 199,
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
