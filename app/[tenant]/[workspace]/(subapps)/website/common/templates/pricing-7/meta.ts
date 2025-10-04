import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing7Schema = {
  title: 'Pricing 7',
  code: 'pricing7',
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
      defaultValue: 'wrapper bg-light angled upper-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16 mb-10 mb-md-18',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing7Data = Data<typeof pricing7Schema>;

export const pricing7Demos: Demo<typeof pricing7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-13',
    sequence: 8,
    data: {
      pricing7Title: 'Our Competitive Pricing',
      pricing7Caption:
        'We provide affordable costs and high-quality items for your business.',
      pricing7Description:
        'Take advantage of our free 30-day trial to experience our full range of services',
      pricing7LinkTitle: 'See All Prices',
      pricing7ButtonLink: '#',
      pricing7ButtonText: 'See All Prices',
      pricing7SwitchLeftLabel: 'Monthly',
      pricing7SwitchRightLabel: 'Yearly (Save 30%)',
      pricing7Plans: [
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
    page: 'demo-13',
    sequence: 8,
    data: {
      pricing7Title: 'Nos tarifs compétitifs',
      pricing7Caption:
        'Nous offrons des coûts abordables et des articles de haute qualité pour votre entreprise.',
      pricing7Description:
        'Profitez de notre essai gratuit de 30 jours pour découvrir notre gamme complète de services',
      pricing7LinkTitle: 'Voir tous les prix',
      pricing7ButtonLink: '#',
      pricing7ButtonText: 'Voir tous les prix',
      pricing7SwitchLeftLabel: 'Mensuel',
      pricing7SwitchRightLabel: 'Annuel (Économisez 30%)',
      pricing7Plans: [
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
