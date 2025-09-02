import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const contact5Schema = {
  title: 'Contact 5',
  code: 'contact5',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'countUp',
      title: 'Count Up',
      type: 'integer',
    },
    {
      name: 'suffix',
      title: 'Suffix',
      type: 'string',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact5Data = Data<typeof contact5Schema>;

export const contact5Demos: Demo<typeof contact5Schema>[] = [
  {
    language: 'en_US',
    data: {
      contact5Title: 'Get in Touch',
      contact5Description:
        "Our portfolio is filled with a diverse range of works that highlight our creativity and innovation. We take great pride in our ability to develop custom solutions that exceed our clients' expectations and push the boundaries of design.",
      contact5Caption:
        'Grow your business with our proven track record of success and join our community of our 5K+ satisfied clients and partner.',
      contact5ButtonLabel: 'Join Us',
      contact5ButtonLink: '#',
      contact5TileImage1: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact5TileImage2: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      contact5Heading: 'Satisfied Clients',
      contact5CountUp: 5000,
      contact5Suffix: '+',
    },
  },
  {
    language: 'fr_FR',
    data: {
      contact5Title: 'Entrer en contact',
      contact5Description:
        'Notre portefeuille est rempli d’un large éventail de travaux qui mettent en valeur notre créativité et notre innovation. Nous sommes très fiers de notre capacité à développer des solutions personnalisées qui dépassent les attentes de nos clients et repoussent les limites du design.',
      contact5Caption:
        'Développez votre entreprise grâce à nos antécédents de réussite éprouvés et rejoignez notre communauté de plus de 5 000 clients et partenaires satisfaits.',
      contact5ButtonLabel: 'Rejoignez-nous',
      contact5ButtonLink: '#',
      contact5TileImage1: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact5TileImage2: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      contact5Heading: 'Clients satisfaits',
      contact5CountUp: 5000,
      contact5Suffix: '+',
    },
  },
];
