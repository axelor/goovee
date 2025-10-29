import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const service26Code = 'service26';

export const service26Schema = {
  title: 'Service 26',
  code: service26Code,
  type: Template.block,
  fields: [
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service26Service',
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
      name: 'Service26Service',
      title: 'Service',
      fields: [
        {
          name: 'title',
          title: 'Title',
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
          name: 'url',
          title: 'Url',
          type: 'string',
        },
        {
          name: 'figcaption',
          title: 'Figcaption',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Service26Data = Data<typeof service26Schema>;

export const service26Demos: Demo<typeof service26Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-23',
    sequence: 2,
    data: {
      service26Description:
        'I adore photographing brides and individuals there are so many emotions to capture.',
      service26Services: [
        {
          attrs: {
            title: 'Wedding',
            image: {
              attrs: {
                alt: 'Wedding',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs1.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
        {
          attrs: {
            title: 'Couples',
            image: {
              attrs: {
                alt: 'Couples',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs2.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
        {
          attrs: {
            title: 'Engagement',
            image: {
              attrs: {
                alt: 'Engagement',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs3.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'View Gallery',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-23',
    sequence: 2,
    data: {
      service26Description:
        'J’adore photographier les mariées et les personnes, il y a tellement d’émotions à capturer.',
      service26Services: [
        {
          attrs: {
            title: 'Mariage',
            image: {
              attrs: {
                alt: 'Mariage',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs1.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
        {
          attrs: {
            title: 'Couples',
            image: {
              attrs: {
                alt: 'Couples',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs2.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
        {
          attrs: {
            title: 'Fiançailles',
            image: {
              attrs: {
                alt: 'Fiançailles',
                width: 380,
                height: 399,
                image: {
                  fileName: 'fs3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs3.jpg',
                },
              },
            },
            url: '#',
            figcaption: 'Voir la galerie',
          },
        },
      ],
    },
  },
];
