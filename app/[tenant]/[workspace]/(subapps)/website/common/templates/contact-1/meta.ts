import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {contactInfoModel, imageModel} from '../json-models';

export const contact1Code = 'contact1';

export const contact1Schema = {
  title: 'Contact 1',
  code: contact1Code,
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
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'contactInfo',
      title: 'Contact Info',
      type: 'json-many-to-one',
      target: 'ContactInfo',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled lower-start',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-8 pb-md-9',
    },
  ],
  models: [contactInfoModel, imageModel],
} as const satisfies TemplateSchema;

export type Contact1Data = Data<typeof contact1Schema>;

export const contact1Demos: Demo<typeof contact1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-3',
    sequence: 10,
    data: {
      contact1Image: {
        attrs: {
          alt: 'Get in touch',
          width: 593,
          height: 568,
          image: {
            fileName: 'about14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about14.jpg',
          },
        },
      },
      contact1Caption: 'Get In Touch',
      contact1Title:
        'Are you ready to start creating something great together?',
      contact1ContactInfo: {
        attrs: {
          name: 'contact-1-contact-info',
          addressTitle: 'Address',
          address: 'Moonshine St. 14/05 Light City, London, United Kingdom',
          phoneTitle: 'Phone',
          phone: '00 (123) 456 78 90',
          emailTitle: 'Email',
          email: 'user@email.com',
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-3',
    sequence: 10,
    data: {
      contact1Image: {
        attrs: {
          alt: 'Entrer en contact',
          width: 593,
          height: 568,
          image: {
            fileName: 'about14.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about14.jpg',
          },
        },
      },
      contact1Caption: 'Entrer en contact',
      contact1Title:
        'Êtes-vous prêt à commencer à créer quelque chose de grand ensemble ?',
      contact1ContactInfo: {
        attrs: {
          name: 'contact-1-contact-info',
          addressTitle: 'Adresse',
          address: 'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
          phoneTitle: 'Téléphone',
          phone: '00 (123) 456 78 90',
          emailTitle: 'E-mail',
          email: 'user@email.com',
        },
      },
    },
  },
];
