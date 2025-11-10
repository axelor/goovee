import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {faq5QuestionsModel} from '../json-models';

export const faq5Code = 'faq5';

export const faq5Schema = {
  title: 'FAQ 5',
  code: faq5Code,
  type: Template.block,
  fields: [
    {
      name: 'questions',
      title: 'Questions',
      type: 'json-one-to-many',
      target: 'Faq5Questions',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-17',
    },
  ],
  models: [faq5QuestionsModel],
} as const satisfies TemplateSchema;

export type Faq5Data = Data<typeof faq5Schema>;

export const faq5Demos: Demo<typeof faq5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-11',
    sequence: 11,
    data: {
      faq5Questions: [
        {
          attrs: {
            title: 'Can I cancel my subscription?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          attrs: {
            title: 'Which payment methods do you accept?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          attrs: {
            title: 'How can I manage my Account?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          attrs: {
            title: 'Is my credit card information secure?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-11',
    sequence: 11,
    data: {
      faq5Questions: [
        {
          attrs: {
            title: 'Puis-je annuler mon abonnement ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          attrs: {
            title: 'Quels modes de paiement acceptez-vous ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          attrs: {
            title: 'Comment puis-je gérer mon compte ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          attrs: {
            title:
              'Les informations de ma carte de crédit sont-elles sécurisées ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
      ],
    },
  },
];
