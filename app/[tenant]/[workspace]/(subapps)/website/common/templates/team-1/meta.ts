import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const team1Code = 'team1';

export const team1Schema = {
  title: 'Team 1',
  code: team1Code,
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gradient-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 pt-md-16 pb-md-18',
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
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Team1Data = Data<typeof team1Schema>;

export const team1Demos: Demo<typeof team1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-1',
    sequence: 6,
    data: {
      team1Title: 'Our Team',
      team1Caption:
        'Think beyond the box and be creative. Lighthouse can help you make a difference.',
      team1Teams: [
        {
          attrs: {
            name: 'Tom Accor',
            image: {
              attrs: {
                alt: 'Tom Accor',
                width: 300,
                height: 300,
                image: {
                  fileName: 't8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t8.jpg',
                },
              },
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Developer',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Selina Anteree',
            image: {
              attrs: {
                alt: 'Selina Anteree',
                width: 300,
                height: 300,
                image: {
                  fileName: 't9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t9.jpg',
                },
              },
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Developer',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Olocks Pree',
            image: {
              attrs: {
                alt: 'Olocks Pree',
                width: 300,
                height: 300,
                image: {
                  fileName: 't10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t10.jpg',
                },
              },
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Designer',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Andree Buie',
            image: {
              attrs: {
                alt: 'Andree Buie',
                width: 300,
                height: 300,
                image: {
                  fileName: 't11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t11.jpg',
                },
              },
            },
            description: "I'm passionate about creating elegant theme.",
            designation: 'Manager',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
    site: 'lighthouse-fr',
    page: 'demo-1',
    sequence: 6,
    data: {
      team1Title: 'Notre équipe',
      team1Caption:
        'Pensez hors des sentiers battus et soyez créatif. Lighthouse peut vous aider à faire la différence.',
      team1Teams: [
        {
          attrs: {
            name: 'Tom Accor',
            image: {
              attrs: {
                alt: 'Tom Accor',
                width: 300,
                height: 300,
                image: {
                  fileName: 't8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t8.jpg',
                },
              },
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Développeur',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Selina Anteree',

            image: {
              attrs: {
                alt: 'Selina Anteree',
                width: 300,
                height: 300,
                image: {
                  fileName: 't9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t9.jpg',
                },
              },
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Développeur',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Olocks Pree',
            image: {
              attrs: {
                alt: 'Olocks Pree',
                width: 300,
                height: 300,
                image: {
                  fileName: 't10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t10.jpg',
                },
              },
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Designer',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
          attrs: {
            name: 'Andree Buie',
            image: {
              attrs: {
                alt: 'Andree Buie',
                width: 300,
                height: 300,
                image: {
                  fileName: 't11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t11.jpg',
                },
              },
            },
            description:
              'Je suis passionné par la création de thèmes élégants.',
            designation: 'Directeur',
            socialLinks: [
              {
                attrs: {
                  name: 'Twitter',
                  icon: 'twitter',
                  url: 'https://www.twitter.com',
                },
              },
              {
                attrs: {
                  name: 'Facebook',
                  icon: 'facebook-f',
                  url: 'https://www.facebook.com',
                },
              },
              {
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
