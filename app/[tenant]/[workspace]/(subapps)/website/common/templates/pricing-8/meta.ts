import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {faq5QuestionsModel, planFeatureModel, planModel} from '../json-models';

export const pricing8Schema = {
  title: 'Pricing 8',
  code: 'pricing8',
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
    {
      name: 'faq',
      title: 'FAQ',
      type: 'json-one-to-many',
      target: 'Faq5Questions',
    },
  ],
  models: [planModel, planFeatureModel, faq5QuestionsModel],
} as const satisfies TemplateSchema;

export type Pricing8Data = Data<typeof pricing8Schema>;

export const pricing8Demos: Demo<typeof pricing8Schema>[] = [
  {
    language: 'en_US',
    data: {
      pricing8Title: 'Our Pricing',
      pricing8Caption: 'We provide perfect and competitive prices.',
      pricing8SwitchLeftLabel: 'Monthly',
      pricing8SwitchRightLabel: 'Yearly',
      pricing8Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Basic',
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
            plan: 'Premium',
            buttonText: 'Choose Plan',
            buttonLink: '#',
            price1: 19,
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
          id: '3',
          version: 0,
          attrs: {
            plan: 'Corporate',
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
      pricing8Faq: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'How do I get my subscription receipt?',
            description:
              'You can get your subscription receipt by logging into your account and going to the billing section. From there, you will be able to see a list of all your past payments and download the receipts as PDFs.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Are there any discounts for people in need?',
            description:
              'Yes, we offer discounts for students, non-profit organizations, and other groups. Please contact us for more information.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Do you offer a free trial?',
            description:
              'Yes, we offer a free 30-day trial for all of our plans. You can sign up for a free trial on our website.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Can I cancel my subscription at any time?',
            description:
              'Yes, you can cancel your subscription at any time. You will continue to have access to the service until the end of your billing period.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      pricing8Title: 'Nos tarifs',
      pricing8Caption: 'Nous offrons des prix parfaits et compétitifs.',
      pricing8SwitchLeftLabel: 'Mensuel',
      pricing8SwitchRightLabel: 'Annuel',
      pricing8Plans: [
        {
          id: '1',
          version: 0,
          attrs: {
            plan: 'Basique',
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
            plan: 'Premium',
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
            plan: 'Entreprise',
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
      pricing8Faq: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Comment puis-je obtenir mon reçu d’abonnement ?',
            description:
              'Vous pouvez obtenir votre reçu d’abonnement en vous connectant à votre compte et en vous rendant dans la section de facturation. De là, vous pourrez voir une liste de tous vos paiements passés et télécharger les reçus au format PDF.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title:
              'Y a-t-il des réductions pour les personnes dans le besoin ?',
            description:
              'Oui, nous offrons des réductions pour les étudiants, les organisations à but non lucratif et d’autres groupes. Veuillez nous contacter pour plus d’informations.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Proposez-vous un essai gratuit ?',
            description:
              'Oui, nous offrons un essai gratuit de 30 jours pour tous nos plans. Vous pouvez vous inscrire pour un essai gratuit sur notre site web.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Puis-je annuler mon abonnement à tout moment ?',
            description:
              'Oui, vous pouvez annuler votre abonnement à tout moment. Vous continuerez à avoir accès au service jusqu’à la fin de votre période de facturation.',
          },
        },
      ],
    },
  },
];
