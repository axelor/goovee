import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const team5Code = 'team5';

export const team5Schema = {
  title: 'Team 5',
  code: team5Code,
  type: Template.block,
  fields: [
    {
      name: 'members',
      title: 'Members',
      type: 'json-one-to-many',
      target: 'Team5Member',
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
      defaultValue: 'container mb-16 mb-md-19',
    },
  ],
  models: [
    {
      name: 'Team5Member',
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

export type Team5Data = Data<typeof team5Schema>;

export const team5Demos: Demo<typeof team5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-8',
    sequence: 7,
    data: {
      team5Members: [
        {
          attrs: {
            name: 'Tom Accor',
            designation: 'Developer',
            image: {
              attrs: {
                alt: 'Tom Accor',
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
            name: 'Anna Trois',
            designation: 'UI and UX Designer',
            image: {
              attrs: {
                alt: 'Anna Trois',
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
            name: 'Sonal Ocer',
            designation: 'Sr. Marketing Manager',
            image: {
              attrs: {
                alt: 'Sonal Ocer',
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
            name: 'Inan Rocketich',
            designation: 'Advisor',
            image: {
              attrs: {
                alt: 'Inan Rocketich',
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
    page: 'demo-8',
    sequence: 7,
    data: {
      team5Members: [
        {
          attrs: {
            name: 'Tom Accor',
            designation: 'Développeur',
            image: {
              attrs: {
                alt: 'Tom Accor',
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
            name: 'Anna Trois',
            designation: 'Concepteur UI et UX',
            image: {
              attrs: {
                alt: 'Anna Trois',
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
            name: 'Sonal Ocer',
            designation: 'Responsable marketing senior',
            image: {
              attrs: {
                alt: 'Sonal Ocer',
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
            name: 'Inan Rocketich',
            designation: 'Conseiller',
            image: {
              attrs: {
                alt: 'Inan Rocketich',
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
