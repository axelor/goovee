import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, bulletPointModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const about8Schema = {
  title: 'About 8',
  code: 'about8',
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

export type About8Data = Data<typeof about8Schema>;

export const about8Demos: Demo<typeof about8Schema>[] = [
  {
    language: 'en_US',
    data: {
      about8Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
      },
      about8Caption: 'Mastery of Control',
      about8Title:
        'We are committed to building lasting connections with our clients.',
      about8Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      about8AboutList: {
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
      about8Image: {
        id: '1',
        version: 1,
        fileName: 'i9.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i9.png',
      },
      about8Caption: 'Maîtrise du contrôle',
      about8Title:
        'Nous nous engageons à établir des liens durables avec nos clients.',
      about8Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes.',
      about8AboutList: {
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
