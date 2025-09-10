import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const team1Schema = {
  title: 'Team 1',
  code: 'team1',
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
      name: 'teams',
      title: 'Teams',
      type: 'json-one-to-many',
      target: 'Team1Teams',
    },
  ],
  models: [
    {
      name: 'Team1Teams',
      title: 'Team 1 Teams',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
        {
          name: 'designation',
          title: 'Designation',
          type: 'string',
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'socialLinks',
          title: 'Social Links',
          type: 'json-one-to-many',
          target: 'SocialLinks',
        },
      ],
    },
    socialLinksModel,
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Team1Data = Data<typeof team1Schema>;

export const team1Demos: Demo<typeof team1Schema>[] = [
  {
    language: 'en_US',
    data: {
      team1Title: 'Our Team',
      team1Caption:
        'Think beyond the box and be creative. Lighthouse can help you make a difference.',
      team1Teams: [
        {
          id: '14',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            image: {
              id: '1',
              version: 1,
              fileName: 't8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t8.jpg',
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Developer',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '15',
          version: 0,
          attrs: {
            name: 'Selina Anteree',
            image: {
              id: '1',
              version: 1,
              fileName: 't9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t9.jpg',
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Developer',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '16',
          version: 0,
          attrs: {
            name: 'Olocks Pree',
            image: {
              id: '1',
              version: 1,
              fileName: 't10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t10.jpg',
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Designer',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '17',
          version: 0,
          attrs: {
            name: 'Andree Buie',
            image: {
              id: '1',
              version: 1,
              fileName: 't11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t11.jpg',
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Manager',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      team1Title: 'Notre équipe',
      team1Caption:
        'Pensez hors des sentiers battus et soyez créatif. Lighthouse peut vous aider à faire la différence.',
      team1Teams: [
        {
          id: '14',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            image: {
              id: '1',
              version: 1,
              fileName: 't8.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t8.jpg',
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Développeur',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '15',
          version: 0,
          attrs: {
            name: 'Selina Anteree',

            image: {
              id: '1',
              version: 1,
              fileName: 't9.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t9.jpg',
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Développeur',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '16',
          version: 0,
          attrs: {
            name: 'Olocks Pree',
            image: {
              id: '1',
              version: 1,
              fileName: 't10.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t10.jpg',
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Designer',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
        {
          id: '17',
          version: 0,
          attrs: {
            name: 'Andree Buie',
            image: {
              id: '1',
              version: 1,
              fileName: 't11.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t11.jpg',
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Directeur',
            socialLinks: [
              {
                id: '1',
                version: 1,
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                id: '2',
                version: 1,
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
                id: '3',
                version: 1,
                attrs: {
                  name: 'Dribbble',
                  icon: 'dribbble',
                  url: 'https://dribbble.com',
                },
              },
            ],
          },
        },
      ],
    },
  },
];
