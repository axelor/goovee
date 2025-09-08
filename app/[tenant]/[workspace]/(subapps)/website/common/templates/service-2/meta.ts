import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';
import {bulletListModel, bulletPointModel} from '../json-models';

export const service2Schema = {
  title: 'Service 2',
  code: 'service2',
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
      type: 'json-many-to-one',
      target: 'BulletList',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [bulletListModel, bulletPointModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Services2Data = Data<typeof service2Schema>;

export const service2Demos: Demo<typeof service2Schema>[] = [
  {
    language: 'en_US',
    data: {
      service2Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      service2Title: 'Our Solutions',
      service2Caption:
        'We provide effortless spending control with complete peace of mind.',
      service2Description:
        'At our company, we understand that managing spending can be stressful and overwhelming, which is why we offer a range of services aimed at effortless for you to stay in control.',
      service2Services: {
        id: '1',
        version: 0,
        attrs: {
          name: 'service',
          bulletColor: 'soft-primary',
          list: [
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
    },
  },
  {
    language: 'fr_FR',
    data: {
      service2Image: {
        id: '1',
        version: 1,
        fileName: 'i8.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i8.png',
      },
      service2Title: 'Nos solutions',
      service2Caption:
        "Nous offrons un contrôle des dépenses sans effort et en toute tranquillité d'esprit.",
      service2Description:
        "Dans notre entreprise, nous comprenons que la gestion des dépenses peut être stressante et accablante, c'est pourquoi nous proposons une gamme de services visant à vous permettre de garder le contrôle sans effort.",
      service2Services: {
        id: '1',
        version: 0,
        attrs: {
          name: 'services',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '40',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '41',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '42',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '43',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
          ],
        },
      },
    },
  },
];
