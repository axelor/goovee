import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {bulletListModel} from '../json-models';

export const about11Code = 'about11';

export const about11Schema = {
  title: 'About 11',
  code: about11Code,
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
      target: 'About11AboutList2',
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
      defaultValue: 'container pt-16 pt-md-18 mb-14 mb-md-18',
    },
  ],
  models: [
    bulletListModel,
    imageModel,
    {
      name: 'About11AboutList2',
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

export type About11Data = Data<typeof about11Schema>;

export const about11Demos: Demo<typeof about11Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-10',
    sequence: 5,
    data: {
      about11TileImage1: {
        attrs: {
          alt: 'Company value proposition',
          width: 240,
          height: 245,
          image: {
            fileName: 'ab1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab1.jpg',
          },
        },
      },
      about11TileImage2: {
        attrs: {
          alt: 'Company value proposition',
          width: 290,
          height: 225,
          image: {
            fileName: 'ab2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab2.jpg',
          },
        },
      },
      about11TileImage3: {
        attrs: {
          alt: 'Company value proposition',
          width: 290,
          height: 440,
          image: {
            fileName: 'ab3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab3.jpg',
          },
        },
      },
      about11Caption: 'Discover our company',
      about11Title:
        'We are a creative advertising firm that focuses on the influence of great design and creative thinking.',
      about11Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      about11AboutList1: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
          ],
        },
      },
      about11AboutList2: [
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
    page: 'demo-10',
    sequence: 5,
    data: {
      about11TileImage1: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 240,
          height: 245,
          image: {
            fileName: 'ab1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab1.jpg',
          },
        },
      },
      about11TileImage2: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 290,
          height: 225,
          image: {
            fileName: 'ab2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab2.jpg',
          },
        },
      },
      about11TileImage3: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 290,
          height: 440,
          image: {
            fileName: 'ab3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab3.jpg',
          },
        },
      },
      about11Caption: 'Découvrez notre entreprise',
      about11Title:
        'Nous sommes une agence de publicité créative qui se concentre sur l’influence d’un bon design et d’une pensée créative.',
      about11Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes.',
      about11AboutList1: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
          ],
        },
      },
      about11AboutList2: [
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
