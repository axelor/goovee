import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {bulletListModel, bulletPointModel} from '../json-models';

export const about11Schema = {
  title: 'About 11',
  code: 'about11',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'tileImage3',
      title: 'Tile Image 3',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
  ],
  models: [
    bulletListModel,
    bulletPointModel,
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
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About11Data = Data<typeof about11Schema>;

export const about11Demos: Demo<typeof about11Schema>[] = [
  {
    language: 'en_US',
    data: {
      about11TileImage1: {
        id: '1',
        version: 1,
        fileName: 'ab1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab1.jpg',
      },
      about11TileImage2: {
        id: '1',
        version: 1,
        fileName: 'ab2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab2.jpg',
      },
      about11TileImage3: {
        id: '1',
        version: 1,
        fileName: 'ab3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab3.jpg',
      },
      about11Caption: 'Discover our company',
      about11Title:
        'We are a creative advertising firm that focuses on the influence of great design and creative thinking.',
      about11Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      about11AboutList1: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '4',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
          ],
        },
      },
      about11AboutList2: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Our Vision',
            description:
              'Customers may choose company offer high-quality product. Customers may choose company high-quality product.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Our Mission',
            description:
              'Customers may choose company offer high-quality product. Customers may choose company high-quality product.',
          },
        },
        {
          id: '3',
          version: 0,
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
    data: {
      about11TileImage1: {
        id: '1',
        version: 1,
        fileName: 'ab1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab1.jpg',
      },
      about11TileImage2: {
        id: '1',
        version: 1,
        fileName: 'ab2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab2.jpg',
      },
      about11TileImage3: {
        id: '1',
        version: 1,
        fileName: 'ab3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/ab3.jpg',
      },
      about11Caption: 'Découvrez notre entreprise',
      about11Title:
        'Nous sommes une agence de publicité créative qui se concentre sur l’influence d’un bon design et d’une pensée créative.',
      about11Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes.',
      about11AboutList1: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
          ],
        },
      },
      about11AboutList2: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Notre vision',
            description:
              'Les clients peuvent choisir une entreprise offrant des produits de haute qualité. Les clients peuvent choisir une entreprise de produits de haute qualité.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Notre mission',
            description:
              'Les clients peuvent choisir une entreprise offrant des produits de haute qualité. Les clients peuvent choisir une entreprise de produits de haute qualité.',
          },
        },
        {
          id: '3',
          version: 0,
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
