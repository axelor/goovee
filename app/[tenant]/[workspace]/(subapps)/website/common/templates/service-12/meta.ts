import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {solidIconsSelection} from '../meta-selections';

export const service12Code = 'service12';

export const service12Schema = {
  title: 'Service 12',
  code: service12Code,
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
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-25',
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
          target: 'Image',
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
    imageModel,
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service12Data = Data<typeof service12Schema>;

export const service12Demos: Demo<typeof service12Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-9',
    sequence: 3,
    data: {
      service12Caption: 'Why Choose us?',
      service12Title:
        'Here are a small number of the reasons why our customers use Lighthouse.',
      service12Tabs: [
        {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 280,
                  height: 338,
                  image: {
                    fileName: 'sa13.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa13.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 270,
                  height: 165,
                  image: {
                    fileName: 'sa14.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa14.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 225,
                  height: 271,
                  image: {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 223,
                  height: 187,
                  image: {
                    fileName: 'sa9.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa9.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 187,
                  height: 217,
                  image: {
                    fileName: 'sa10.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa10.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 321,
                  height: 116,
                  image: {
                    fileName: 'sa11.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa11.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 4',
                  width: 294,
                  height: 383,
                  image: {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 272,
                  height: 163,
                  image: {
                    fileName: 'sa5.png',
                    fileType: 'image/png',
                    filePath: '/img/photos/sa5.png',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 250,
                  height: 277,
                  image: {
                    fileName: 'sa6.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa6.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 300,
                  height: 181,
                  image: {
                    fileName: 'sa7.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa7.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 4',
                  width: 229,
                  height: 297,
                  image: {
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
    site: 'lighthouse-fr',
    page: 'demo-9',
    sequence: 3,
    data: {
      service12Caption: 'Pourquoi nous choisir ?',
      service12Title:
        'Voici quelques-unes des raisons pour lesquelles nos clients utilisent Lighthouse.',
      service12Tabs: [
        {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 280,
                  height: 338,
                  image: {
                    fileName: 'sa13.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa13.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 270,
                  height: 165,
                  image: {
                    fileName: 'sa14.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa14.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 225,
                  height: 271,
                  image: {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 223,
                  height: 187,
                  image: {
                    fileName: 'sa9.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa9.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 187,
                  height: 217,
                  image: {
                    fileName: 'sa10.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa10.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 321,
                  height: 116,
                  image: {
                    fileName: 'sa11.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa11.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 4',
                  width: 294,
                  height: 383,
                  image: {
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
                attrs: {item: 'Aenean eu leo quam. Pellentesque ornare.'},
              },
              {
                attrs: {item: 'Nullam quis risus eget urna mollis ornare.'},
              },
              {
                attrs: {item: 'Donec id elit non mi porta gravida at eget.'},
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            images: [
              {
                attrs: {
                  alt: 'Slide 1',
                  width: 272,
                  height: 163,
                  image: {
                    fileName: 'sa5.png',
                    fileType: 'image/png',
                    filePath: '/img/photos/sa5.png',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 2',
                  width: 250,
                  height: 277,
                  image: {
                    fileName: 'sa6.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa6.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 3',
                  width: 300,
                  height: 181,
                  image: {
                    fileName: 'sa7.jpg',
                    fileType: 'image/jpeg',
                    filePath: '/img/photos/sa7.jpg',
                  },
                },
              },
              {
                attrs: {
                  alt: 'Slide 4',
                  width: 229,
                  height: 297,
                  image: {
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
