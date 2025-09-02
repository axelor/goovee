import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';

export const faq1Schema = {
  title: 'FAQ 1',
  code: 'faq1',
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

export type Faq1Data = Data<typeof faq1Schema>;

export const faq1Demos: Demo<typeof faq1Schema>[] = [
  {
    language: 'en_US',
    data: {
      faq1Title:
        'If you are unable to locate the answer to your query, you may send us an email using our contact page.',
      faq1Caption: 'FAQ',
      faq1Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'How often should I get a physical examination?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading: 'How can I access mental health services?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'What should I do if I have a medical emergency?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'What is telemedicine, and how does it work?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            heading: 'How can I quit smoking or other tobacco use?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            heading: 'How can I stay safe and healthy while traveling?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      faq1Title:
        'Si vous ne parvenez pas à trouver la réponse à votre question, vous pouvez nous envoyer un e-mail via notre page de contact.',
      faq1Caption: 'FAQ',
      faq1Questions: [
        {
          id: '1',
          version: 0,
          attrs: {
            heading: 'À quelle fréquence dois-je passer un examen physique ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            heading: 'Comment puis-je accéder aux services de santé mentale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            heading: 'Que dois-je faire en cas d’urgence médicale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            heading: 'Qu’est-ce que la télémédecine et comment ça marche ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            heading:
              'Comment puis-je arrêter de fumer ou de consommer d’autres produits du tabac ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            heading:
              'Comment puis-je rester en sécurité et en bonne santé en voyage ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
      ],
    },
  },
];
