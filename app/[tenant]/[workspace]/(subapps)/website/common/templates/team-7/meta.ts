import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, bulletPointModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const team7Schema = {
  title: 'Team 7',
  code: 'team7',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
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
      name: 'list',
      title: 'List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
  ],
  models: [bulletListModel, bulletPointModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Team7Data = Data<typeof team7Schema>;

export const team7Demos: Demo<typeof team7Schema>[] = [
  {
    language: 'en_US',
    data: {
      team7Caption: 'Our Team',
      team7Title: 'Choose our team of experts to save time.',
      team7Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      team7Image: {
        id: '1',
        version: 1,
        fileName: 'about24.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about24.jpg',
      },
      team7List: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '4',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      team7Caption: 'Notre équipe',
      team7Title: 'Choisissez notre équipe d’experts pour gagner du temps.',
      team7Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et qui interagissent les unes avec les autres dans un lieu ou un espace virtuel partagé. Les communautés peuvent prendre diverses formes.',
      team7Image: {
        id: '1',
        version: 1,
        fileName: 'about24.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about24.jpg',
      },
      team7List: {
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
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
          ],
        },
      },
    },
  },
];
