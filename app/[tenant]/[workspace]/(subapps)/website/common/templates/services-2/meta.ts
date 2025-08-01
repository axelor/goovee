import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';

export const services2Schema = {
  title: 'Services 2',
  code: 'services2',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Services2Services',
    },
  ],
  models: [
    {
      name: 'Services2Services',
      title: 'Services 2 Services',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Services2Data = Data<typeof services2Schema>;

export const services2Demos: Demo<typeof services2Schema>[] = [
  {
    language: 'en_US',
    data: {
      services2Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      services2Title: 'Our Solutions',
      services2Caption:
        'We provide effortless spending control with complete peace of mind.',
      services2Description:
        'At our company, we understand that managing spending can be stressful and overwhelming, which is why we offer a range of services aimed at effortless for you to stay in control.',
      services2Services: [
        {
          id: '40',
          version: 0,
          attrs: {title: 'We offer stress-free spending control.'},
        },
        {
          id: '41',
          version: 0,
          attrs: {title: 'We offer stress-free spending control.'},
        },
        {
          id: '42',
          version: 0,
          attrs: {title: 'We offer stress-free spending control.'},
        },
        {
          id: '43',
          version: 0,
          attrs: {title: 'We offer stress-free spending control.'},
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      services2Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      services2Title: 'Nos solutions',
      services2Caption:
        "Nous offrons un contrôle des dépenses sans effort et en toute tranquillité d'esprit.",
      services2Description:
        "Dans notre entreprise, nous comprenons que la gestion des dépenses peut être stressante et accablante, c'est pourquoi nous proposons une gamme de services visant à vous permettre de garder le contrôle sans effort.",
      services2Services: [
        {
          id: '40',
          version: 0,
          attrs: {title: 'Nous offrons un contrôle des dépenses sans stress.'},
        },
        {
          id: '41',
          version: 0,
          attrs: {title: 'Nous offrons un contrôle des dépenses sans stress.'},
        },
        {
          id: '42',
          version: 0,
          attrs: {title: 'Nous offrons un contrôle des dépenses sans stress.'},
        },
        {
          id: '43',
          version: 0,
          attrs: {title: 'Nous offrons un contrôle des dépenses sans stress.'},
        },
      ],
    },
  },
];
