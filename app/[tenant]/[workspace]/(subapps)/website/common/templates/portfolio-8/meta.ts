import {startCase} from 'lodash-es';
import {colors} from '../../constants/colors';
import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

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
          selection: colors.map(color => ({
            title: startCase(color),
            value: color,
          })),
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
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
        {
          name: 'linkUrl',
          title: 'Link URL',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Portfolio8Data = Data<typeof portfolio8Schema>;

export const portfolio8Demos: Demo<typeof portfolio8Schema>[] = [
  {
    language: 'en_US',
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
              id: '1',
              version: 1,
              fileName: 'pd1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd1.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd2.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd3.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd4.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd5.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd6.jpg',
            },
            linkUrl: '#',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
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
              id: '1',
              version: 1,
              fileName: 'pd1.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd1.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd2.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd2.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd3.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd3.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd4.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd5.jpg',
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
              id: '1',
              version: 1,
              fileName: 'pd6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/pd6.jpg',
            },
            linkUrl: '#',
          },
        },
      ],
    },
  },
];
