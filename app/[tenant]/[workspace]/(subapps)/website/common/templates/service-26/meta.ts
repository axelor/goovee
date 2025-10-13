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
    site: 'en',
    page: 'demo-23',
    sequence: 2,
    data: {
      service26Description:
        'I adore photographing brides and individuals there are so many emotions to capture.',
      service26Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Wedding',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Wedding',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
          id: '2',
          version: 0,
          attrs: {
            title: 'Couples',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Couples',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
          id: '3',
          version: 0,
          attrs: {
            title: 'Engagement',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Engagement',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
    site: 'fr',
    page: 'demo-23',
    sequence: 2,
    data: {
      service26Description:
        'J’adore photographier les mariées et les personnes, il y a tellement d’émotions à capturer.',
      service26Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Mariage',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Mariage',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
          id: '2',
          version: 0,
          attrs: {
            title: 'Couples',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Couples',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
          id: '3',
          version: 0,
          attrs: {
            title: 'Fiançailles',
            image: {
              id: '1',
              version: 0,
              attrs: {
                alt: 'Fiançailles',
                width: 380,
                height: 399,
                image: {
                  id: '1',
                  version: 1,
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
