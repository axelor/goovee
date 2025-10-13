import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';

export const faq2Code = 'faq2';

export const faq2Schema = {
  title: 'FAQ 2',
  code: faq2Code,
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [accordionModel],
} as const satisfies TemplateSchema;

export type Faq2Data = Data<typeof faq2Schema>;

export const faq2Demos: Demo<typeof faq2Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-9',
    sequence: 7,
    data: {
      faq2Title:
        'If you cannot locate a solution to your query, please use our contact page to send us a message.',
      faq2Caption: 'FAQ',
      faq2Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'How do I get my subscription receipt?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading: 'Are there any discounts for people in need?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'Do you offer a free trial edit?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'How do I reset my Account password?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-9',
    sequence: 7,
    data: {
      faq2Title:
        'Si vous ne trouvez pas de solution à votre question, veuillez utiliser notre page de contact pour nous envoyer un message.',
      faq2Caption: 'FAQ',
      faq2Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'Comment puis-je obtenir mon reçu d’abonnement ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading:
              'Y a-t-il des réductions pour les personnes dans le besoin ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'Proposez-vous une modification d’essai gratuite ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'Comment réinitialiser le mot de passe de mon compte ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
      ],
    },
  },
];
