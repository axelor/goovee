import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const team2Schema = {
  title: 'Team 2',
  code: 'team2',
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
      name: 'para',
      title: 'Para',
      type: 'string',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team2Member',
    },
  ],
  models: [
    {
      name: 'Team2Member',
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

export type Team2Data = Data<typeof team2Schema>;

export const team2Demos: Demo<typeof team2Schema>[] = [
  {
    language: 'en_US',
    data: {
      team2Caption: 'Meet the Team',
      team2Title:
        'Choose our team to enjoy the benefits of efficient & cost-effective solutions',
      team2Para:
        'Maximize your resources with our professional team’s time and cost-effective solutions. Partner with us to save valuable time and money.',
      team2Navigation: false,
      team2ButtonLabel: 'See All Members',
      team2ButtonLink: '#',
      team2Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            image: {
              id: '1',
              version: 1,
              fileName: 't3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t3.jpg',
            },
            designation: 'MARKETING MANAGER',
            description: 'Strategic marketing is my passion.',
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
            name: 'Gabriel Rodriguez',
            image: {
              id: '1',
              version: 1,
              fileName: 't7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t7.jpg',
            },
            designation: 'SALES DIRECTOR',
            description: 'Strategic marketing is my passion.',
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
            name: 'Samuel Patel',
            image: {
              id: '1',
              version: 1,
              fileName: 't6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t6.jpg',
            },
            designation: 'HR MANAGER',
            description: 'Strategic marketing is my passion.',
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
            description: 'Strategic marketing is my passion.',
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
      team2Caption: 'Rencontrez l’équipe',
      team2Title:
        'Choisissez notre équipe pour profiter des avantages de solutions efficaces et rentables',
      team2Para:
        'Maximisez vos ressources grâce aux solutions rapides et rentables de notre équipe de professionnels. Collaborez avec nous pour économiser un temps et un argent précieux.',
      team2Navigation: false,
      team2ButtonLabel: 'Voir tous les membres',
      team2ButtonLink: '#',
      team2Members: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'Ethan Johnson',
            image: {
              id: '1',
              version: 1,
              fileName: 't3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t3.jpg',
            },
            designation: 'RESPONSABLE MARKETING',
            description: 'Le marketing stratégique est ma passion.',
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
            name: 'Gabriel Rodriguez',
            image: {
              id: '1',
              version: 1,
              fileName: 't7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t7.jpg',
            },
            designation: 'DIRECTEUR DES VENTES',
            description: 'Le marketing stratégique est ma passion.',
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
            name: 'Samuel Patel',
            image: {
              id: '1',
              version: 1,
              fileName: 't6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/avatars/t6.jpg',
            },
            designation: 'RESPONSABLE RH',
            description: 'Le marketing stratégique est ma passion.',
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
            designation: 'Directrice',
            description: 'Le marketing stratégique est ma passion.',
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

