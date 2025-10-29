import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio3Code = 'portfolio3';

export const portfolio3Schema = {
  title: 'Portfolio 3',
  code: portfolio3Code,
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
      name: 'slidesPerView',
      title: 'Slides Per View',
      type: 'integer',
    },
    {
      name: 'pagination',
      title: 'Pagination',
      type: 'boolean',
    },
    {
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio3PortfolioList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper overflow-hidden',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-12 pt-lg-7 pb-14 pb-md-16',
    },
  ],
  models: [
    {
      name: 'Portfolio3PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'url',
          title: 'Url',
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
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio3Data = Data<typeof portfolio3Schema>;

export const portfolio3Demos: Demo<typeof portfolio3Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-21',
    sequence: 7,
    data: {
      portfolio3Caption: 'Latest Projects',
      portfolio3Description:
        'Check out some of our awesome projects with creative ideas and great design.',
      portfolio3SlidesPerView: 2,
      portfolio3Pagination: false,
      portfolio3PortfolioList: [
        {
          attrs: {
            url: '#',
            category: 'Mobile Design',
            title: 'Cras Fermentum Sem',
            image: {
              attrs: {
                alt: 'Cras Fermentum Sem',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp1.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Web Design',
            title: 'Venenatis Euismod Vehicula',
            image: {
              attrs: {
                alt: 'Venenatis Euismod Vehicula',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp2.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Stationary',
            title: 'Tortor Tellus Cursus',
            image: {
              attrs: {
                alt: 'Tortor Tellus Cursus',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp3.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Web Application',
            title: 'Ridiculus Sem Parturient',
            image: {
              attrs: {
                alt: 'Ridiculus Sem Parturient',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp4.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Web Design',
            title: 'Cursus Sollicitudin Adipiscing',
            image: {
              attrs: {
                alt: 'Cursus Sollicitudin Adipiscing',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Stationary',
            title: 'Fringilla Quam Vulputate',
            image: {
              attrs: {
                alt: 'Fringilla Quam Vulputate',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp6.jpg',
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
    page: 'demo-21',
    sequence: 7,
    data: {
      portfolio3Caption: 'Derniers projets',
      portfolio3Description:
        'Découvrez quelques-uns de nos superbes projets avec des idées créatives et un superbe design.',
      portfolio3SlidesPerView: 2,
      portfolio3Pagination: false,
      portfolio3PortfolioList: [
        {
          attrs: {
            url: '#',
            category: 'Conception mobile',
            title: 'Cras Fermentum Sem',
            image: {
              attrs: {
                alt: 'Cras Fermentum Sem',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp1.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Conception de sites Web',
            title: 'Venenatis Euismod Vehicula',
            image: {
              attrs: {
                alt: 'Venenatis Euismod Vehicula',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp2.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Papeterie',
            title: 'Tortor Tellus Cursus',
            image: {
              attrs: {
                alt: 'Tortor Tellus Cursus',
                width: 585,
                height: 384,
                image: {
                  fileName: 'sp3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp3.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Application Web',
            title: 'Ridiculus Sem Parturient',
            image: {
              attrs: {
                alt: 'Ridiculus Sem Parturient',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp4.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Conception de sites Web',
            title: 'Cursus Sollicitudin Adipiscing',
            image: {
              attrs: {
                alt: 'Cursus Sollicitudin Adipiscing',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            url: '#',
            category: 'Papeterie',
            title: 'Fringilla Quam Vulputate',
            image: {
              attrs: {
                alt: 'Fringilla Quam Vulputate',
                width: 630,
                height: 410,
                image: {
                  fileName: 'sp6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/sp6.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
