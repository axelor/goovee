import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {bulletListModel, bulletPointModel} from '../json-models';

export const about17Schema = {
  title: 'About 17',
  code: 'about17',
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
      name: 'aboutList',
      title: 'About List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [bulletListModel, bulletPointModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About17Data = Data<typeof about17Schema>;

export const about17Demos: Demo<typeof about17Schema>[] = [
  {
    language: 'en_US',
    data: {
      about17Image: {
        id: '1',
        version: 1,
        fileName: '3d2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/3d2.png',
      },
      about17Caption: 'Our Solution',
      about17Title:
        'We offer services to help control money in efficient way possible.',
      about17Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Goals and interact with one another in a shared location or virtual space.',
      about17AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '4',
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
      about17Image: {
        id: '1',
        version: 1,
        fileName: '3d2.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/3d2.png',
      },
      about17Caption: 'Notre solution',
      about17Title:
        'Nous proposons des services pour aider à contrôler l’argent de la manière la plus efficace possible.',
      about17Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les objectifs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel.',
      about17AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '4',
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
