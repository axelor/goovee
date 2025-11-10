import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio1Code = 'portfolio1';

export const portfolio1Schema = {
  title: 'Portfolio 1',
  code: portfolio1Code,
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
      name: 'images',
      title: 'Images',
      type: 'json-one-to-many',
      target: 'Portfolio1Images',
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
      defaultValue: 'container-fluid px-md-6',
    },
  ],
  models: [
    {
      name: 'Portfolio1Images',
      title: 'Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio1Data = Data<typeof portfolio1Schema>;

export const portfolio1Demos: Demo<typeof portfolio1Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-2',
    sequence: 5,
    data: {
      portfolio1Caption: 'Latest Projects',
      portfolio1Description:
        'Discover our exceptional projects, combining imaginative ideas with exceptional design.',
      portfolio1Images: [
        {
          attrs: {
            name: 'Project 1',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp10.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Project 2',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp11.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Project 3',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp12.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Project 4',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp10.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Project 5',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp11.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Project 6',
            image: {
              attrs: {
                alt: 'Project',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp12.jpg',
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
    site: 'lighthouse-fr',
    page: 'demo-2',
    sequence: 5,
    data: {
      portfolio1Caption: 'Derniers projets',
      portfolio1Description:
        'Découvrez quelques-uns de nos superbes projets avec des idées créatives et un superbe design.',
      portfolio1Images: [
        {
          attrs: {
            name: 'Projet 1',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp10.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Projet 2',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp11.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Projet 3',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp12.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Projet 4',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp10.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Projet 5',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp11.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            name: 'Projet 6',
            image: {
              attrs: {
                alt: 'Projet',
                width: 380,
                height: 320,
                image: {
                  fileName: 'pp12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pp12.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
