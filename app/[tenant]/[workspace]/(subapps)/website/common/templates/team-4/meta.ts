import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const team4Schema = {
  title: 'Team 4',
  code: 'team4',
  type: Template.block,
  fields: [
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team4Member',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light position-relative',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [
    {
      name: 'Team4Member',
      title: 'Member',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'designation',
          title: 'Designation',
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

export type Team4Data = Data<typeof team4Schema>;

export const team4Demos: Demo<typeof team4Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-4',
    sequence: 7,
    data: {
      team4Members: [
        {
          id: '1',
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
            designation: 'Developer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '2',
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
            designation: 'Developer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '3',
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
            designation: 'Designer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '4',
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
            designation: 'Manager',
            description: "I'm passionate about creating elegant theme.",
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
    page: 'demo-4',
    sequence: 7,
    data: {
      team4Members: [
        {
          id: '1',
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
            designation: 'Développeur',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '2',
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
            designation: 'Développeur',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '3',
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
            designation: 'Designer',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '4',
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
            designation: 'Manager',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
    language: 'en_US',
    page: 'demo-21',
    sequence: 6,
    data: {
      team4WrapperClassName: 'wrapper bg-light',
      team4ContainerClassName: 'container pb-14 pb-md-16',
      team4Members: [
        {
          id: '1',
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
            designation: 'Developer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '2',
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
            designation: 'Developer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '3',
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
            designation: 'Designer',
            description: "I'm passionate about creating elegant theme.",
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
          id: '4',
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
            designation: 'Manager',
            description: "I'm passionate about creating elegant theme.",
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
    page: 'demo-21',
    sequence: 6,
    data: {
      team4WrapperClassName: 'wrapper bg-light',
      team4ContainerClassName: 'container pb-14 pb-md-16',
      team4Members: [
        {
          id: '1',
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
            designation: 'Développeur',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '2',
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
            designation: 'Développeur',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '3',
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
            designation: 'Designer',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
          id: '4',
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
            designation: 'Manager',
            description:
              'Je suis passionné par la création de thèmes élégants.',
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
