import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const team6Code = 'team6';

export const team6Schema = {
  title: 'Team 6',
  code: team6Code,
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
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team6Member',
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
      defaultValue: 'container pb-14 pb-md-17 mb-md-20',
    },
  ],
  models: [
    {
      name: 'Team6Member',
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
          name: 'designation',
          title: 'Designation',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Team6Data = Data<typeof team6Schema>;

export const team6Demos: Demo<typeof team6Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-11',
    sequence: 8,
    data: {
      team6Caption: 'Our Team',
      team6Title:
        'Look beyond the box and get creative. Lighthouse can help you create an influence.',
      team6Members: [
        {
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Financial Analyst',
            image: {
              attrs: {
                alt: 'Coriss Ambady',
                width: 300,
                height: 300,
                image: {
                  fileName: 't1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t1.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Cory Zamora',
            designation: 'Marketing Specialist',
            image: {
              attrs: {
                alt: 'Cory Zamora',
                width: 300,
                height: 300,
                image: {
                  fileName: 't2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t2.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Sales Manager',
            image: {
              attrs: {
                alt: 'Nikolas Brooten',
                width: 300,
                height: 300,
                image: {
                  fileName: 't3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t3.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Investment Planner',
            image: {
              attrs: {
                alt: 'Jackie Sanders',
                width: 300,
                height: 300,
                image: {
                  fileName: 't4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t4.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-11',
    sequence: 8,
    data: {
      team6Caption: 'Notre équipe',
      team6Title:
        'Sortez des sentiers battus et soyez créatif. Lighthouse peut vous aider à créer une influence.',
      team6Members: [
        {
          attrs: {
            name: 'Coriss Ambady',
            designation: 'Analyste financier',
            image: {
              attrs: {
                alt: 'Coriss Ambady',
                width: 300,
                height: 300,
                image: {
                  fileName: 't1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t1.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Cory Zamora',
            designation: 'Spécialiste du marketing',
            image: {
              attrs: {
                alt: 'Cory Zamora',
                width: 300,
                height: 300,
                image: {
                  fileName: 't2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t2.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Nikolas Brooten',
            designation: 'Directeur des ventes',
            image: {
              attrs: {
                alt: 'Nikolas Brooten',
                width: 300,
                height: 300,
                image: {
                  fileName: 't3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t3.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Jackie Sanders',
            designation: 'Planificateur d’investissement',
            image: {
              attrs: {
                alt: 'Jackie Sanders',
                width: 300,
                height: 300,
                image: {
                  fileName: 't4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/avatars/t4.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
