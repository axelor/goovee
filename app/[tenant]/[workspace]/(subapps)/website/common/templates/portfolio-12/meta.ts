import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio12Code = 'portfolio12';

export const portfolio12Schema = {
  title: 'Portfolio 12',
  code: portfolio12Code,
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'navigation',
      title: 'Navigation',
      type: 'boolean',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio12PortfolioList',
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
      defaultValue: 'container pt-15 pt-md-17',
    },
  ],
  models: [
    {
      name: 'Portfolio12PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'link',
          title: 'Link',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
        {
          name: 'fullImage',
          title: 'Full Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio12Data = Data<typeof portfolio12Schema>;

export const portfolio12Demos: Demo<typeof portfolio12Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-22',
    sequence: 6,
    data: {
      portfolio12Caption: 'Latest Projects',
      portfolio12Description:
        'Check out some of our awesome projects with creative ideas and great design.',
      portfolio12Navigation: false,
      portfolio12PortfolioList: [
        {
          attrs: {
            link: '/single-project-1',
            category: 'Stationary',
            title: 'Cras Fermentum Sem',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd7.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Project',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd7-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd7-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Magazine, Book',
            title: 'Mollis Ipsum Mattis',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd8.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Project',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd8-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd8-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Packaging',
            title: 'Ipsum Ultricies Cursus',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd9.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Project',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd9-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd9-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Stationary, Branding',
            title: 'Inceptos Euismod Egestas',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd10.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Project',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd10-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd10-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Packaging',
            title: 'Ipsum Mollis Vulputate',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd11.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Project',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd11-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd11-full.jpg',
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
    page: 'demo-22',
    sequence: 6,
    data: {
      portfolio12Caption: 'Derniers projets',
      portfolio12Description:
        'Découvrez quelques-unes de nos œuvres fantastiques avec des designs exceptionnels et des concepts innovants.',
      portfolio12Navigation: false,
      portfolio12PortfolioList: [
        {
          attrs: {
            link: '/single-project-1',
            category: 'Papeterie',
            title: 'Cras Fermentum Sem',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd7.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Projet',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd7-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd7-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Magazine, Livre',
            title: 'Mollis Ipsum Mattis',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd8.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Projet',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd8-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd8-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Emballage',
            title: 'Ipsum Ultricies Cursus',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd9.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Projet',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd9-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd9-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Papeterie, Marque',
            title: 'Inceptos Euismod Egestas',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd10.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Projet',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd10-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd10-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            link: '/single-project-1',
            category: 'Emballage',
            title: 'Ipsum Mollis Vulputate',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 408,
                image: {
                  fileName: 'pd11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd11.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Projet',
                width: 1800,
                height: 1939,
                image: {
                  fileName: 'pd11-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd11-full.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
