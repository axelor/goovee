import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service27Schema = {
  title: 'Service 27',
  code: 'service27',
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
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service27Service',
    },
  ],
  models: [
    {
      name: 'Service27Service',
      title: 'Service',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
        {
          name: 'url',
          title: 'URL',
          type: 'string',
        },
        {
          name: 'figcaption',
          title: 'Figcaption',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service27Data = Data<typeof service27Schema>;

export const service27Demos: Demo<typeof service27Schema>[] = [
  {
    language: 'en_US',
    data: {
      service27Title: 'My Services',
      service27Description:
        'Restaurant services refer to the various elements that make up the dining experience at a restaurant. Include menu selection, food preparation, table service.',
      service27LinkTitle: 'More Details',
      service27LinkHref: '#',
      service27Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Products',
            url: '#',
            figcaption: 'View Gallery',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs4.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'View Gallery',
            title: 'Recipes',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs6.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'View Gallery',
            title: 'Restaurants',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs5.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'View Gallery',
            title: 'Still Life',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs7.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service27Title: 'Mes services',
      service27Description:
        'Les services de restauration font référence aux différents éléments qui composent l’expérience culinaire dans un restaurant. Inclure la sélection du menu, la préparation des plats, le service à table.',
      service27LinkTitle: 'Plus de détails',
      service27LinkHref: '#',
      service27Services: [
        {
          id: '1',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'Voir la galerie',
            title: 'Produits',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs4.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs4.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'Voir la galerie',
            title: 'Recettes',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs6.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs6.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'Voir la galerie',
            title: 'Restaurants',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs5.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs5.jpg',
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            url: '#',
            figcaption: 'Voir la galerie',
            title: 'Nature morte',
            image: {
              id: '1',
              version: 1,
              fileName: 'fs7.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/fs7.jpg',
            },
          },
        },
      ],
    },
  },
];
