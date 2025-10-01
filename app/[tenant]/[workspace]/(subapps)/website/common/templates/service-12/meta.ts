import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {solidIconsSelection} from '../meta-selections';

export const service12Schema = {
  title: 'Service 12',
  code: 'service12',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'tabs',
      title: 'Tabs',
      type: 'json-one-to-many',
      target: 'Service12Tab',
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
  models: [
    {
      name: 'Service12Tab',
      title: 'Tab',
      fields: [
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
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
        {
          name: 'listTitle',
          title: 'List Title',
          type: 'string',
        },
        {
          name: 'listDescription',
          title: 'List Description',
          type: 'string',
        },
        {
          name: 'list',
          title: 'List',
          type: 'json-one-to-many',
          target: 'Service12ListItem',
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
          name: 'images',
          title: 'Images',
          type: 'json-one-to-many',
          target: 'Service12Image',
        },
      ],
    },
    {
      name: 'Service12ListItem',
      title: 'List Item',
      fields: [
        {
          name: 'item',
          title: 'Item',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    {
      name: 'Service12Image',
      title: 'Image',
      fields: [
        {
          name: 'alt',
          title: 'Alt',
          type: 'string',
          visibleInGrid: true,
          nameField: true,
        },
        {
          name: 'image',
          title: 'Image',
          type: 'many-to-one',
          target: 'com.axelor.meta.db.MetaFile',
          widget: 'Image',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service12Data = Data<typeof service12Schema>;

export const service12Demos: Demo<typeof service12Schema>[] = [
  {
    language: 'en_US',
    data: {
      service12Caption: 'Why Choose us?',
      service12Title:
        'Here are a small number of the reasons why our customers use Lighthouse.',
      service12Tabs: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: 'Easy Usage',
            description:
              'Duis mollis commodo luctus cursus commodo tortor mauris.',
            listTitle: 'Easy Usage',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa13.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa13.jpg',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa14.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa14.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa15.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa15.jpg',
                  },
                },
              },
            ],
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: 'Fast Transactions',
            description:
              'Vivamus sagittis lacus augue fusce dapibus tellus nibh.',
            listTitle: 'Fast Transactions',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa9.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa9.jpg',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa10.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa10.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa11.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa11.jpg',
                  },
                },
              },
              {
                id: '4',
                version: 0,
                attrs: {
                  alt: 'Slide 4',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa12.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa12.jpg',
                  },
                },
              },
            ],
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: 'Secure Payments',
            description:
              'Vestibulum ligula porta felis maecenas faucibus mollis.',
            listTitle: 'Secure Payments',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa5.png',
                    fileType: 'image/png',
                    filePath: '/img/photos/sa5.png',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa6.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa6.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa7.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa7.jpg',
                  },
                },
              },
              {
                id: '4',
                version: 0,
                attrs: {
                  alt: 'Slide 4',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa8.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa8.jpg',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      service12Caption: 'Pourquoi nous choisir ?',
      service12Title:
        'Voici quelques-unes des raisons pour lesquelles nos clients utilisent Lighthouse.',
      service12Tabs: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'CheckShield',
            title: 'Utilisation facile',
            description:
              'Duis mollis commodo luctus cursus commodo tortor mauris.',
            listTitle: 'Utilisation facile',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa13.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa13.jpg',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa14.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa14.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa15.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa15.jpg',
                  },
                },
              },
            ],
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'Dollar',
            title: 'Transactions rapides',
            description:
              'Vivamus sagittis lacus augue fusce dapibus tellus nibh.',
            listTitle: 'Transactions rapides',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa9.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa9.jpg',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa10.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa10.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa11.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa11.jpg',
                  },
                },
              },
              {
                id: '4',
                version: 0,
                attrs: {
                  alt: 'Slide 4',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa12.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa12.jpg',
                  },
                },
              },
            ],
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'Update',
            title: 'Paiements sécurisés',
            description:
              'Vestibulum ligula porta felis maecenas faucibus mollis.',
            listTitle: 'Paiements sécurisés',
            listDescription:
              'Etiam porta sem malesuada magna mollis euismod. Donec ullamcorper nulla non metus auctor fringilla. Morbi leo risus, porta ac consectetur ac, vestibulum at eros. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus. Nullam quis risus eget urna.',
            list: [
              {
                id: '1',
                version: 0,
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                id: '2',
                version: 0,
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                id: '3',
                version: 0,
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                id: '1',
                version: 0,
                attrs: {
                  alt: 'Slide 1',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa5.png',
                    fileType: 'image/png',
                    filePath: '/img/photos/sa5.png',
                  },
                },
              },
              {
                id: '2',
                version: 0,
                attrs: {
                  alt: 'Slide 2',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa6.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa6.jpg',
                  },
                },
              },
              {
                id: '3',
                version: 0,
                attrs: {
                  alt: 'Slide 3',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa7.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa7.jpg',
                  },
                },
              },
              {
                id: '4',
                version: 0,
                attrs: {
                  alt: 'Slide 4',
                  image: {
                    id: '1',
                    version: 1,
                    fileName: 'sa8.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa8.jpg',
                  },
                },
              },
            ],
          },
        },
      ],
    },
  },
];
