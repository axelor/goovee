import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const team7Code = 'team7';

export const team7Schema = {
  title: 'Team 7',
  code: team7Code,
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
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'list',
      title: 'List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [bulletListModel, imageModel],
} as const satisfies TemplateSchema;

export type Team7Data = Data<typeof team7Schema>;

export const team7Demos: Demo<typeof team7Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 6,
    data: {
      team7Caption: 'Our Team',
      team7Title: 'Choose our team of experts to save time.',
      team7Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      team7Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Our team',
          width: 496,
          height: 424,
          image: {
            id: '1',
            version: 1,
            fileName: 'about24.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about24.jpg',
          },
        },
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
    site: 'fr',
    page: 'demo-17',
    sequence: 6,
    data: {
      team7Caption: 'Notre équipe',
      team7Title: 'Choisissez notre équipe d’experts pour gagner du temps.',
      team7Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et qui interagissent les unes avec les autres dans un lieu ou un espace virtuel partagé. Les communautés peuvent prendre diverses formes.',
      team7Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Notre équipe',
          width: 496,
          height: 424,
          image: {
            id: '1',
            version: 1,
            fileName: 'about24.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about24.jpg',
          },
        },
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
