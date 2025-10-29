import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {planModel} from '../json-models';

export const pricing1Code = 'pricing1';

export const pricing1Schema = {
  title: 'Pricing 1',
  code: pricing1Code,
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
    site: 'lighthouse-en',
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
          attrs: {
            plan: 'Corporate Plan',
            price1: 54.0,
            price2: 499.0,
            features: [
              {
                attrs: {label: '20 Projects'},
              },
              {
                attrs: {label: '300K API Access'},
              },
              {
                attrs: {label: '500MB Storage'},
              },
              {
                attrs: {label: 'Weekly Reports'},
              },
              {
                attrs: {label: '7/24 Support'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choose Plan',
          },
        },
        {
          jsonModel: 'Pricing1Plans',
          attrs: {
            plan: 'Premium Plan',
            price1: 25.0,
            price2: 199.0,
            bulletBg: true,
            features: [
              {
                attrs: {label: '5 Projects'},
              },
              {
                attrs: {label: '100K API Access'},
              },
              {
                attrs: {label: '200MB Storage'},
              },
              {
                attrs: {label: 'Weekly Reports'},
              },
              {
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
    site: 'lighthouse-fr',
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
          attrs: {
            plan: "Plan d'entreprise",
            price1: 54.0,
            price2: 499.0,
            features: [
              {
                attrs: {label: '20 projets'},
              },
              {
                attrs: {label: '300K accès API'},
              },
              {
                attrs: {label: '500 Mo de stockage'},
              },
              {
                attrs: {label: 'Rapports hebdomadaires'},
              },
              {
                attrs: {label: 'Assistance 7j/24'},
              },
            ],
            buttonLink: '#',
            buttonText: 'Choisir le plan',
          },
        },
        {
          jsonModel: 'Pricing1Plans',
          attrs: {
            plan: 'Plan Premium',
            price1: 25.0,
            price2: 199.0,
            bulletBg: true,
            features: [
              {
                attrs: {label: '5 projets'},
              },
              {
                attrs: {label: '100K accès API'},
              },
              {
                attrs: {label: '200 Mo de stockage'},
              },
              {
                attrs: {label: 'Rapports hebdomadaires'},
              },
              {
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
