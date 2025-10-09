import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {contactInfoModel} from '../json-models';

export const contact7Schema = {
  title: 'Contact 7',
  code: 'contact7',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled upper-end lower-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-18 pb-14 pt-md-19 pb-md-16',
    },
  ],
  models: [contactInfoModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact7Data = Data<typeof contact7Schema>;

export const contact7Demos: Demo<typeof contact7Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-15',
    sequence: 7,
    data: {
      contact7Image: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact7Title:
        'Are you ready to start creating something great together?',
      contact7ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-7-contact-info',
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
    page: 'demo-15',
    sequence: 7,
    data: {
      contact7Image: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact7Title:
        'Êtes-vous prêt à commencer à créer quelque chose de grand ensemble ?',
      contact7ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-7-contact-info',
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
