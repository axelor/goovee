import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {contactInfoModel} from '../json-models';

export const contact6Schema = {
  title: 'Contact 6',
  code: 'contact6',
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
      defaultValue: 'wrapper bg-soft-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-17',
    },
  ],
  models: [contactInfoModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact6Data = Data<typeof contact6Schema>;

export const contact6Demos: Demo<typeof contact6Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-12',
    sequence: 8,
    data: {
      contact6Image: {
        id: '1',
        version: 1,
        fileName: 'i5.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i5.png',
      },
      contact6Title: "Got any questions? Don't hesitate to get in touch.",
      contact6ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-6-contact-info',
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
    page: 'demo-12',
    sequence: 8,
    data: {
      contact6Image: {
        id: '1',
        version: 1,
        fileName: 'i5.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i5.png',
      },
      contact6Title:
        'Vous avez des questions ? N’hésitez pas à nous contacter.',
      contact6ContactInfo: {
        id: '1',
        version: 0,
        attrs: {
          name: 'contact-6-contact-info',
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
