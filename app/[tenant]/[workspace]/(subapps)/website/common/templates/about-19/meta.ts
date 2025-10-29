import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const about19Code = 'about19';

export const about19Schema = {
  title: 'About 19',
  code: about19Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
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
      name: 'tileImage1',
      title: 'Tile Image 1',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'tileImage3',
      title: 'Tile Image 3',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'aboutList1',
      title: 'About List 1',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
    {
      name: 'aboutList2',
      title: 'About List 2',
      type: 'json-one-to-many',
      target: 'About19AboutList2',
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
      defaultValue: 'container mb-14 mb-md-18',
    },
  ],
  models: [
    bulletListModel,
    imageModel,
    {
      name: 'About19AboutList2',
      title: 'About List 2',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type About19Data = Data<typeof about19Schema>;

export const about19Demos: Demo<typeof about19Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-18',
    sequence: 8,
    data: {
      about19TileImage1: {
        attrs: {
          alt: 'Creative advertising firm',
          width: 272,
          height: 239,
          image: {
            fileName: 'g12.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g12.jpg',
          },
        },
      },
      about19TileImage2: {
        attrs: {
          alt: 'Creative advertising firm',
          width: 272,
          height: 218,
          image: {
            fileName: 'g13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g13.jpg',
          },
        },
      },
      about19TileImage3: {
        attrs: {
          alt: 'Creative advertising firm',
          width: 545,
          height: 267,
          image: {
            fileName: 'g11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g11.jpg',
          },
        },
      },
      about19Caption: 'Who Are We?',
      about19Title:
        'We are a creative advertising firm that influence of great design.',
      about19Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms. A community refers to a group of people who share common interests.',
      about19AboutList1: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title: 'Aenean eu leo quam ornare curabitur blandit tempus.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare donec elit.',
              },
            },
            {
              attrs: {title: 'Etiam porta sem malesuada magna mollis euismod.'},
            },
            {
              attrs: {title: 'Fermentum massa vivamus faucibus amet euismod.'},
            },
          ],
        },
      },
      about19AboutList2: [
        {
          attrs: {
            title: 'Our Vision',
            description:
              'Customers may choose company offer high-quality product. Customers may choose company high-quality product.',
          },
        },
        {
          attrs: {
            title: 'Our Mission',
            description:
              'Customers may choose company offer high-quality product. Customers may choose company high-quality product.',
          },
        },
        {
          attrs: {
            title: 'Our Values',
            description:
              'Customers may choose company offer high-quality product. Customers may choose company high-quality product.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-18',
    sequence: 8,
    data: {
      about19TileImage1: {
        attrs: {
          alt: 'Entreprise de publicité créative',
          width: 272,
          height: 239,
          image: {
            fileName: 'g12.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g12.jpg',
          },
        },
      },
      about19TileImage2: {
        attrs: {
          alt: 'Entreprise de publicité créative',
          width: 272,
          height: 218,
          image: {
            fileName: 'g13.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g13.jpg',
          },
        },
      },
      about19TileImage3: {
        attrs: {
          alt: 'Entreprise de publicité créative',
          width: 545,
          height: 267,
          image: {
            fileName: 'g11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/g11.jpg',
          },
        },
      },
      about19Caption: 'Qui sommes-nous ?',
      about19Title:
        'Nous sommes une agence de publicité créative qui influence le grand design.',
      about19Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes. Une communauté fait référence à un groupe de personnes qui partagent des intérêts communs.',
      about19AboutList1: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title: 'Aenean eu leo quam ornare curabitur blandit tempus.',
              },
            },
            {
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare donec elit.',
              },
            },
            {
              attrs: {title: 'Etiam porta sem malesuada magna mollis euismod.'},
            },
            {
              attrs: {title: 'Fermentum massa vivamus faucibus amet euismod.'},
            },
          ],
        },
      },
      about19AboutList2: [
        {
          attrs: {
            title: 'Notre vision',
            description:
              'Les clients peuvent choisir une entreprise offrant des produits de haute qualité. Les clients peuvent choisir une entreprise de produits de haute qualité.',
          },
        },
        {
          attrs: {
            title: 'Notre mission',
            description:
              'Les clients peuvent choisir une entreprise offrant des produits de haute qualité. Les clients peuvent choisir une entreprise de produits de haute qualité.',
          },
        },
        {
          attrs: {
            title: 'Nos valeurs',
            description:
              'Les clients peuvent choisir une entreprise offrant des produits de haute qualité. Les clients peuvent choisir une entreprise de produits de haute qualité.',
          },
        },
      ],
    },
  },
];
