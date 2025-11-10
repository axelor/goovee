import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel} from '../json-models';

export const faq6Code = 'faq6';

export const faq6Schema = {
  title: 'FAQ 6',
  code: faq6Code,
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
      name: 'linkHref',
      title: 'Link Href',
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-6 pb-14 pb-md-16',
    },
  ],
  models: [accordionModel],
} as const satisfies TemplateSchema;

export type Faq6Data = Data<typeof faq6Schema>;

export const faq6Demos: Demo<typeof faq6Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-21',
    sequence: 9,
    data: {
      faq6Title:
        "You can use our inquiry form to reach us if you don't see a reply to your query there.",
      faq6Caption: 'FAQ',
      faq6Description:
        'Software engineers provide a range of services related to the development, deployment, and maintenance of software applications.',
      faq6LinkTitle: 'All FAQ',
      faq6LinkHref: '#',
      faq6Questions: [
        {
          attrs: {
            heading: 'How do I get my subscription receipt?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Are there any discounts for people in need?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Do you offer a free trial edit?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-21',
    sequence: 9,
    data: {
      faq6Title:
        'Vous pouvez utiliser notre formulaire de demande pour nous joindre si vous ne voyez pas de réponse à votre question.',
      faq6Caption: 'FAQ',
      faq6Description:
        'Les ingénieurs logiciels fournissent une gamme de services liés au développement, au déploiement et à la maintenance d’applications logicielles.',
      faq6LinkTitle: 'Toutes les FAQ',
      faq6LinkHref: '#',
      faq6Questions: [
        {
          attrs: {
            heading: 'Comment puis-je obtenir mon reçu d’abonnement ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading:
              'Y a-t-il des réductions pour les personnes dans le besoin ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Proposez-vous une modification d’essai gratuite ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
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
