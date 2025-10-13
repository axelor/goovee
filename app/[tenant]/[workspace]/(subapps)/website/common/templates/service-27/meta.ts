import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const service27Code = 'service27';

export const service27Schema = {
  title: 'Service 27',
  code: service27Code,
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-15 py-md-17',
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
          type: 'json-many-to-one',
          target: 'Image',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Service27Data = Data<typeof service27Schema>;

export const service27Demos: Demo<typeof service27Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-24',
    sequence: 2,
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
              version: 0,
              attrs: {
                alt: 'Products',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs4.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Recipes',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs6.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Restaurants',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs5.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Still Life',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs7.jpg',
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
    site: 'fr',
    page: 'demo-24',
    sequence: 2,
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
              version: 0,
              attrs: {
                alt: 'Produits',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs4.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Recettes',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs6.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Restaurants',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs5.jpg',
                },
              },
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
              version: 0,
              attrs: {
                alt: 'Nature morte',
                width: 278,
                height: 190,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'fs7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/fs7.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
