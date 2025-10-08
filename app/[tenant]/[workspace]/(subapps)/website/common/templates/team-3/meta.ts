import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const team3Schema = {
  title: 'Team 3',
  code: 'team3',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'spaceBetween',
      title: 'Space Between',
      type: 'integer',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team3Member',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [
    {
      name: 'Team3Member',
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
          type: 'json-many-to-one',
          target: 'Image',
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

export type Team3Data = Data<typeof team3Schema>;

export const team3Demos: Demo<typeof team3Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-15',
    sequence: 5,
    data: {
      team3Title:
        'Choose our team to enjoy the benefits of efficient & cost-effective solutions',
      team3SpaceBetween: 0,
      team3Navigation: false,
      team3Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Tom Accor',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t8.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Selina Anteree',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t9.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Olocks Pree',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t10.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Andree Buie',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t11.jpg',
                },
              },
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
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Cory Smith',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Cory Smith',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t5.jpg',
                },
              },
            },
            designation: 'Project Manager',
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
    site: 'fr',
    page: 'demo-15',
    sequence: 5,
    data: {
      team3Title:
        'Choisissez notre équipe pour profiter des avantages de solutions efficaces et rentables',
      team3SpaceBetween: 0,
      team3Navigation: false,
      team3Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Tom Accor',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Tom Accor',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t8.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Selina Anteree',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t9.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Olocks Pree',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t10.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Andree Buie',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t11.jpg',
                },
              },
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
        {
          id: '5',
          version: 0,
          attrs: {
            name: 'Cory Smith',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Cory Smith',
                width: 300,
                height: 300,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 't5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t5.jpg',
                },
              },
            },
            designation: 'Chef de projet',
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
