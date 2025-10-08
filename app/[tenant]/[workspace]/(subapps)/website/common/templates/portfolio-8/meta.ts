import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {colorsSelection} from '../meta-selections';

export const portfolio8Schema = {
  title: 'Portfolio 8',
  code: 'portfolio8',
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
      name: 'portfolioList',
      title: 'Portfolio List',
      type: 'json-one-to-many',
      target: 'Portfolio8PortfolioList',
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
      defaultValue: 'container py-14 py-md-17',
    },
  ],
  models: [
    {
      name: 'Portfolio8PortfolioList',
      title: 'Portfolio List',
      fields: [
        {
          name: 'color',
          title: 'Color',
          type: 'string',
          selection: 'colors',
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
          target: 'Image',
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
  selections: [colorsSelection],
} as const satisfies TemplateSchema;

export type Portfolio8Data = Data<typeof portfolio8Schema>;

export const portfolio8Demos: Demo<typeof portfolio8Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-14',
    sequence: 4,
    data: {
      portfolio8Caption: 'Our Projects',
      portfolio8Description:
        'Look out for a few of our fantastic works with outstanding designs and innovative concepts.',
      portfolio8PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            color: 'yellow',
            category: 'Coffee',
            title: 'Cras Fermentum Sem',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Cras Fermentum Sem',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd1.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            color: 'red',
            category: 'Stationary',
            title: 'Mollis Ipsum Mattis',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Mollis Ipsum Mattis',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd2.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            color: 'orange',
            category: 'Branding',
            title: 'Ipsum Ultricies Cursus',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Ipsum Ultricies Cursus',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd3.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            color: 'purple',
            category: 'Product',
            title: 'Inceptos Euismod Egestas',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Inceptos Euismod Egestas',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd4.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            color: 'leaf',
            category: 'Print',
            title: 'Sollicitudin Ornare Porta',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Sollicitudin Ornare Porta',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd5.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            color: 'aqua',
            category: 'Workshop',
            title: 'Ipsum Mollis Vulputate',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Ipsum Mollis Vulputate',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd6.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-14',
    sequence: 4,
    data: {
      portfolio8Caption: 'Nos projets',
      portfolio8Description:
        'Découvrez quelques-unes de nos œuvres fantastiques avec des designs exceptionnels et des concepts innovants.',
      portfolio8PortfolioList: [
        {
          id: '1',
          version: 0,
          attrs: {
            color: 'yellow',
            category: 'Café',
            title: 'Cras Fermentum Sem',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Cras Fermentum Sem',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd1.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            color: 'red',
            category: 'Papeterie',
            title: 'Mollis Ipsum Mattis',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Mollis Ipsum Mattis',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd2.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            color: 'orange',
            category: 'Marque',
            title: 'Ipsum Ultricies Cursus',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Ipsum Ultricies Cursus',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd3.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            color: 'purple',
            category: 'Produit',
            title: 'Inceptos Euismod Egestas',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Inceptos Euismod Egestas',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd4.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            color: 'leaf',
            category: 'Imprimer',
            title: 'Sollicitudin Ornare Porta',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Sollicitudin Ornare Porta',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd5.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            color: 'aqua',
            category: 'Atelier',
            title: 'Ipsum Mollis Vulputate',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Ipsum Mollis Vulputate',
                width: 380,
                height: 331,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pd6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pd6.jpg',
                },
              },
            },
            linkUrl: '#',
          },
        },
      ],
    },
  },
];
