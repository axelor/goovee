import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const contact2Schema = {
  title: 'Contacts 2',
  code: 'contact2',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Contact2Data = Data<typeof contact2Schema>;

export const contact2Demos: Demo<typeof contact2Schema>[] = [
  {
    language: 'en_US',
    data: {
      contact2Title: 'Let’s Talk',
      contact2Description1:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      contact2Description2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      contact2LinkTitle: 'Join Us',
      contact2LinkHref: '#',
      contact2Image: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
      },
    },
  },
  {
    language: 'fr_FR',
    data: {
      contact2Title: 'Parlons',
      contact2Description1:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      contact2Description2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      contact2LinkTitle: 'Rejoignez-nous',
      contact2LinkHref: '#',
      contact2Image: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
      },
    },
  },
];
