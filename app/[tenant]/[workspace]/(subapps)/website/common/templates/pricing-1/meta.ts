import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {planModel} from '../json-models';

export const pricing1Schema = {
  title: 'Pricing 1',
  code: 'pricing1',
  type: Template.block,
  fields: [
    {
      name: 'roundShape',
      title: 'Round Shape',
      type: 'boolean',
    },
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
      name: 'buttonText',
      title: 'Button Text',
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
      defaultValue: 'wrapper bg-light angled upper-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-7 pt-md-14',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing1Data = Data<typeof pricing1Schema>;

export const pricing1Demos: Demo<typeof pricing1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-1',
    sequence: 9,
    data: {
      pricing1Title: 'Our Pricing',
      pricing1Caption: 'We provide excellent and premium pricing.',
      pricing1ButtonLink: '#',
      pricing1ButtonText: 'See All Prices',
      pricing1RoundShape: true,
      pricing1Description:
        'Get a free 30-day trial to use the entire service. There is no need for a credit card!',
      pricing1SwitchLeftLabel: 'Monthly',
      pricing1SwitchRightLabel: 'Yearly (Save 30%)',
      pricing1Plans: [
        {
          id: '39',
          version: 1,
          attrs: {
            plan: 'Corporate Plan',
            price1: 54.0,
            price2: 499.0,
            features: [
              {
                id: '34',
                version: 0,
                attrs: {label: '20 Projects'},
              },
              {
                id: '35',
                version: 0,
                attrs: {label: '300K API Access'},
              },
              {
                id: '36',
                version: 0,
                attrs: {label: '500MB Storage'},
              },
              {
                id: '37',
                version: 0,
                attrs: {label: 'Weekly Reports'},
              },
              {
                id: '38',
                version: 0,
                attrs: {label: '7/24 Support'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choose Plan',
          },
        },
        {
          id: '33',
          version: 1,
          jsonModel: 'Pricing1Plans',
          attrs: {
            plan: 'Premium Plan',
            price1: 25.0,
            price2: 199.0,
            bulletBg: true,
            features: [
              {
                id: '28',
                version: 0,
                attrs: {label: '5 Projects'},
              },
              {
                id: '29',
                version: 0,
                attrs: {label: '100K API Access'},
              },
              {
                id: '30',
                version: 0,
                attrs: {label: '200MB Storage'},
              },
              {
                id: '31',
                version: 0,
                attrs: {label: 'Weekly Reports'},
              },
              {
                id: '32',
                version: 0,
                attrs: {label: '7/24 Support'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choose Plan',
            roundedButton: true,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-1',
    sequence: 9,
    data: {
      pricing1Title: 'Nos tarifs',
      pricing1Caption: 'Nous offrons des prix excellents et premium.',
      pricing1ButtonLink: '#',
      pricing1ButtonText: 'Voir tous les prix',
      pricing1RoundShape: true,
      pricing1Description:
        "Obtenez un essai gratuit de 30 jours pour utiliser l'ensemble du service. Aucune carte de crédit n'est requise !",
      pricing1SwitchLeftLabel: 'Mensuel',
      pricing1SwitchRightLabel: 'Annuel (Économisez 30%)',
      pricing1Plans: [
        {
          id: '39',
          version: 1,
          attrs: {
            plan: "Plan d'entreprise",
            price1: 54.0,
            price2: 499.0,
            features: [
              {
                id: '34',
                version: 0,
                attrs: {label: '20 projets'},
              },
              {
                id: '35',
                version: 0,
                attrs: {label: '300K accès API'},
              },
              {
                id: '36',
                version: 0,
                attrs: {label: '500 Mo de stockage'},
              },
              {
                id: '37',
                version: 0,
                attrs: {label: 'Rapports hebdomadaires'},
              },
              {
                id: '38',
                version: 0,
                attrs: {label: 'Assistance 7j/24'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choisir le plan',
          },
        },
        {
          id: '33',
          version: 1,
          jsonModel: 'Pricing1Plans',
          attrs: {
            plan: 'Plan Premium',
            price1: 25.0,
            price2: 199.0,
            bulletBg: true,
            features: [
              {
                id: '28',
                version: 0,
                attrs: {label: '5 projets'},
              },
              {
                id: '29',
                version: 0,
                attrs: {label: '100K accès API'},
              },
              {
                id: '30',
                version: 0,
                attrs: {label: '200 Mo de stockage'},
              },
              {
                id: '31',
                version: 0,
                attrs: {label: 'Rapports hebdomadaires'},
              },
              {
                id: '32',
                version: 0,
                attrs: {label: 'Assistance 7j/24'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choisir le plan',
            roundedButton: true,
          },
        },
      ],
    },
  },
];
