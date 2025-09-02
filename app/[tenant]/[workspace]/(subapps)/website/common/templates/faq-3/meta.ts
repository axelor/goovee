import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';

export const faq3Schema = {
  title: 'FAQ 3',
  code: 'faq3',
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
      name: 'questions',
      title: 'Questions',
      target: 'Accordion',
      type: 'json-one-to-many',
    },
  ],
  models: [accordionModel],
} as const satisfies TemplateSchema;

export type Faq3Data = Data<typeof faq3Schema>;

export const faq3Demos: Demo<typeof faq3Schema>[] = [
  {
    language: 'en_US',
    data: {
      faq3Title: 'Frequently Asked Questions',
      faq3Caption:
        'Genuinely lack a response to your query, please use the form below to drop us a message.',
      faq3Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'How often should I get a physical examination?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading: 'How can I access mental health services?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'What should I do if I have a medical emergency?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'What is telemedicine, and how does it work?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      faq3Title: 'Foire aux questions',
      faq3Caption:
        'Si vous n’avez vraiment pas de réponse à votre question, veuillez utiliser le formulaire ci-dessous pour nous envoyer un message.',
      faq3Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'À quelle fréquence dois-je passer un examen physique ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading: 'Comment puis-je accéder aux services de santé mentale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'Que dois-je faire en cas d’urgence médicale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'Qu’est-ce que la télémédecine et comment ça marche ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel.',
            expand: false,
          },
        },
      ],
    },
  },
];
