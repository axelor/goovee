import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const contact3Schema = {
  title: 'Contact 3',
  code: 'contact3',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description1',
      title: 'Description 1',
      type: 'string',
    },
    {
      name: 'description2',
      title: 'Description 2',
      type: 'string',
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact3Data = Data<typeof contact3Schema>;

export const contact3Demos: Demo<typeof contact3Schema>[] = [
  {
    language: 'en_US',
    data: {
      contact3Title: 'Let’s Talk',
      contact3Description1:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      contact3Description2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      contact3LinkTitle: 'Join Us',
      contact3LinkHref: '#',
      contact3TileImage1: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact3TileImage2: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      contact3Heading: 'Satisfied Clients',
      contact3CountUp: 5000,
      contact3Suffix: '+',
    },
  },
  {
    language: 'fr_FR',
    data: {
      contact3Title: 'Parlons',
      contact3Description1:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      contact3Description2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      contact3LinkTitle: 'Rejoignez-nous',
      contact3LinkHref: '#',
      contact3TileImage1: {
        id: '1',
        version: 1,
        fileName: 'about4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about4.jpg',
      },
      contact3TileImage2: {
        id: '1',
        version: 1,
        fileName: 'about5.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about5.jpg',
      },
      contact3Heading: 'Clients satisfaits',
      contact3CountUp: 5000,
      contact3Suffix: '+',
    },
  },
];
