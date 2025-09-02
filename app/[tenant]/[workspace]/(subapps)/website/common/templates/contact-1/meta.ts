import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {contactInfoModel} from '../json-models';

export const contact1Schema = {
  title: 'Contact 1',
  code: 'contact1',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'contactInfo',
      title: 'Contact Info',
      type: 'json-many-to-one',
      target: 'ContactInfo',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [contactInfoModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact1Data = Data<typeof contact1Schema>;

export const contact1Demos: Demo<typeof contact1Schema>[] = [
  {
    language: 'en_US',
    data: {
      contact1Image: {
        id: '1',
        version: 1,
        fileName: 'about14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about14.jpg',
      },
      contact1Caption: 'Get In Touch',
      contact1Title:
        'Are you ready to start creating something great together?',
      contact1ContactInfo: {
        id: '1',
        version: 0,
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
    data: {
      contact1Image: {
        id: '1',
        version: 1,
        fileName: 'about14.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about14.jpg',
      },
      contact1Caption: 'Entrer en contact',
      contact1Title:
        'Êtes-vous prêt à commencer à créer quelque chose de grand ensemble ?',
      contact1ContactInfo: {
        id: '1',
        version: 0,
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
