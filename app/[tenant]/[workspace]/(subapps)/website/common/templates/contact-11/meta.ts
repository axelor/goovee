import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {contactInfoModel} from '../json-models';

export const contact11Schema = {
  title: 'Contact 11',
  code: 'contact11',
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
      defaultValue: 'container mb-15 mb-md-18',
    },
  ],
  models: [contactInfoModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact11Data = Data<typeof contact11Schema>;

export const contact11Demos: Demo<typeof contact11Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-18',
    sequence: 9,
    data: {
      contact11Image: {
        id: '1',
        version: 1,
        fileName: '3d2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/3d2.png',
      },
      contact11Caption: 'Contact Us',
      contact11Title: "Got any questions? Don't hesitate to get in touch.",
      contact11ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-11-contact-info',
          addressTitle: 'Address',
          address: 'Moonshine St. 14/05 Light City, London',
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
    page: 'demo-18',
    sequence: 9,
    data: {
      contact11Image: {
        id: '1',
        version: 1,
        fileName: '3d2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/3d2.png',
      },
      contact11Caption: 'Contactez-nous',
      contact11Title:
        'Vous avez des questions ? N’hésitez pas à nous contacter.',
      contact11ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-11-contact-info',
          addressTitle: 'Adresse',
          address: 'Moonshine St. 14/05 Light City, Londres',
          phoneTitle: 'Téléphone',
          phone: '00 (123) 456 78 90',
          emailTitle: 'E-mail',
          email: 'user@email.com',
        },
      },
    },
  },
];
