import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio4Code = 'portfolio4';

export const portfolio4Schema = {
  title: 'Portfolio 4',
  code: portfolio4Code,
  type: Template.block,
  fields: [
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'figCaption',
      title: 'Fig Caption',
      type: 'string',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio4PortfolioList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper overflow-hidden bg-light',
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
      name: 'Portfolio4PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'stat',
          title: 'Stat',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          target: 'Image',
        },
        {
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio4Data = Data<typeof portfolio4Schema>;

export const portfolio4Demos: Demo<typeof portfolio4Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-23',
    sequence: 5,
    data: {
      portfolio4Description:
        'A few of the most touching stories I experienced and got the opportunity to photograph',
      portfolio4Pagination: false,
      portfolio4FigCaption: 'View Gallery',
      portfolio4PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Wedding',
            name: 'Tom & Jerry',
            linkUrl: '#',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Tom & Jerry',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc1.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Wedding',
            name: 'Stacy & Thomas',
            linkUrl: '#',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Stacy & Thomas',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc2.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            stat: '7 Photos',
            category: 'Couples',
            name: 'Katherine & Jack',
            linkUrl: '#',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Katherine & Jack',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc3.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Wedding',
            name: 'Jolene & William',
            linkUrl: '#',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Jolene & William',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc4.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            stat: '6 Photos',
            category: 'Engagement',
            name: 'Jenn & Richard',
            linkUrl: '#',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Jenn & Richard',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc5.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Wedding',
            name: 'Gloria & Leo',
            linkUrl: '#',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Gloria & Leo',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc6.jpg',
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
    site: 'fr',
    page: 'demo-23',
    sequence: 5,
    data: {
      portfolio4Description:
        'Quelques-unes des histoires les plus touchantes que j’ai vécues et que j’ai eu l’occasion de photographier',
      portfolio4Pagination: false,
      portfolio4FigCaption: 'Voir la galerie',
      portfolio4PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Mariage',
            name: 'Tom & Jerry',
            linkUrl: '#',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Tom & Jerry',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc1.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Mariage',
            name: 'Stacy & Thomas',
            linkUrl: '#',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Stacy & Thomas',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc2.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            stat: '7 Photos',
            category: 'Couples',
            name: 'Katherine & Jack',
            linkUrl: '#',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Katherine & Jack',
                width: 585,
                height: 412,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc3.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            stat: '9 Photos',
            category: 'Mariage',
            name: 'Jolene & William',
            linkUrl: '#',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Jolene & William',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc4.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            stat: '6 Photos',
            category: 'Fiançailles',
            name: 'Jenn & Richard',
            linkUrl: '#',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Jenn & Richard',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc5.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            stat: '8 Photos',
            category: 'Mariage',
            name: 'Gloria & Leo',
            linkUrl: '#',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Gloria & Leo',
                width: 630,
                height: 440,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fc6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fc6.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
