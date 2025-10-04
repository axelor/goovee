import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {planModel} from '../json-models';

export const pricing4Schema = {
  title: 'Pricing 4',
  code: 'pricing4',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
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
      defaultValue: '',
    },
    {
      name: 'innerWrapper1ClassName',
      title: 'Inner Wrapper 1 Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'innerContainer1ClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-14 pb-18 pt-md-17 pb-md-22 text-center',
    },
    {
      name: 'innerWrapper2ClassName',
      title: 'Inner Wrapper 2 Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'innerContainer2ClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
    },
    {
      name: 'pricingWrapperClassName',
      title: 'Pricing Wrapper Class Name',
      type: 'string',
      defaultValue: 'pricing-wrapper position-relative mt-n22 mt-md-n24',
    },
  ],
  models: [planModel],
} as const satisfies TemplateSchema;

export type Pricing4Data = Data<typeof pricing4Schema>;

export const pricing4Demos: Demo<typeof pricing4Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-5',
    sequence: 6,
    data: {
      pricing4Title: 'We provide perfect and competitive prices.',
      pricing4SwitchLeftLabel: 'Monthly',
      pricing4SwitchRightLabel: 'Yearly',
      pricing4Plans: [
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
    site: 'fr',
    page: 'demo-5',
    sequence: 6,
    data: {
      pricing4Title: 'Nous offrons des prix parfaits et compétitifs.',
      pricing4SwitchLeftLabel: 'Mensuel',
      pricing4SwitchRightLabel: 'Annuel',
      pricing4Plans: [
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
            price1: 49,
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
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-11',
    sequence: 10,
    data: {
      pricing4InnerContainer1ClassName: 'container pb-18 pb-md-22 text-center',
      pricing4InnerWrapper1ClassName: 'wrapper bg-gray',
      pricing4InnerWrapper2ClassName: 'wrapper bg-gray',
      pricing4Title: 'We provide perfect and competitive prices.',
      pricing4SwitchLeftLabel: 'Monthly',
      pricing4SwitchRightLabel: 'Yearly',
      pricing4Plans: [
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
    site: 'fr',
    page: 'demo-11',
    sequence: 10,
    data: {
      pricing4InnerContainer1ClassName: 'container pb-18 pb-md-22 text-center',
      pricing4InnerWrapper1ClassName: 'wrapper bg-gray',
      pricing4InnerWrapper2ClassName: 'wrapper bg-gray',
      pricing4Title: 'Nous offrons des prix parfaits et compétitifs.',
      pricing4SwitchLeftLabel: 'Mensuel',
      pricing4SwitchRightLabel: 'Annuel',
      pricing4Plans: [
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
            price1: 49,
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
