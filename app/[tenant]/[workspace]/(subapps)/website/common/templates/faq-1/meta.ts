import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {accordionModel, imageModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const faq1Code = 'faq1';

export const faq1Schema = {
  title: 'FAQ 1',
  code: faq1Code,
  type: Template.block,
  fields: [
    {
      name: 'media',
      title: 'Media',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
      defaultValue: 'container py-14 pt-md-16 pt-lg-0 pb-md-16',
    },
  ],
  models: [accordionModel, imageModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Faq1Data = Data<typeof faq1Schema>;

export const faq1Demos: Demo<typeof faq1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-6',
    sequence: 4,
    data: {
      faq1Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      faq1Thumbnail: {
        attrs: {
          alt: 'FAQ video thumbnail',
          width: 995,
          height: 604,
          image: {
            fileName: 'v1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/v1.jpg',
          },
        },
      },
      faq1Title:
        'If you are unable to locate the answer to your query, you may send us an email using our contact page.',
      faq1Caption: 'FAQ',
      faq1Questions: [
        {
          attrs: {
            heading: 'How often should I get a physical examination?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'How can I access mental health services?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'What should I do if I have a medical emergency?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'What is telemedicine, and how does it work?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'How can I quit smoking or other tobacco use?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
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
    site: 'lighthouse-fr',
    page: 'demo-6',
    sequence: 4,
    data: {
      faq1Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      faq1Thumbnail: {
        attrs: {
          alt: 'Vignette vidéo FAQ',
          width: 995,
          height: 604,
          image: {
            fileName: 'v1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/v1.jpg',
          },
        },
      },
      faq1Title:
        'Si vous ne parvenez pas à trouver la réponse à votre question, vous pouvez nous envoyer un e-mail via notre page de contact.',
      faq1Caption: 'FAQ',
      faq1Questions: [
        {
          attrs: {
            heading: 'À quelle fréquence dois-je passer un examen physique ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Comment puis-je accéder aux services de santé mentale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Que dois-je faire en cas d’urgence médicale ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading: 'Qu’est-ce que la télémédecine et comment ça marche ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
          attrs: {
            heading:
              'Comment puis-je arrêter de fumer ou de consommer d’autres produits du tabac ?',
            body: 'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Cras mattis consectetur purus sit amet fermentum. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec sed odio dui. Cras justo odio, dapibus ac facilisis.',
            expand: false,
          },
        },
        {
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
