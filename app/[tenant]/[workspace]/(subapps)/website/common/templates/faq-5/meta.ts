import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const faq5Schema = {
  title: 'FAQ 5',
  code: 'faq5',
  type: Template.block,
  fields: [
    {
      name: 'questions',
      title: 'Questions',
      type: 'json-one-to-many',
      target: 'Faq5Questions',
    },
  ],
  models: [
    {
      name: 'Faq5Questions',
      title: 'Questions',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Faq5Data = Data<typeof faq5Schema>;

export const faq5Demos: Demo<typeof faq5Schema>[] = [
  {
    language: 'en_US',
    data: {
      faq5Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Can I cancel my subscription?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Which payment methods do you accept?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'How can I manage my Account?',
            description:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
          },
        },
        {
          id: '4',
          version: 0,
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
    data: {
      faq5Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Puis-je annuler mon abonnement ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Quels modes de paiement acceptez-vous ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Comment puis-je gérer mon compte ?',
            description:
              'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
          },
        },
        {
          id: '4',
          version: 0,
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
