import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const portfolio5Code = 'portfolio5';

export const portfolio5Schema = {
  title: 'Portfolio 5',
  code: portfolio5Code,
  type: Template.block,
  fields: [
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
      name: 'list',
      title: 'List',
      type: 'json-one-to-many',
      target: 'Portfolio5List',
    },
    {
      name: 'filterList',
      title: 'Filter List',
      type: 'json-one-to-many',
      target: 'Portfolio5FilterList',
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
      defaultValue: 'container py-15 py-md-17 text-center',
    },
  ],
  models: [
    {
      name: 'Portfolio5List',
      title: 'List',
      fields: [
        {
          name: 'value',
          title: 'Value',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    {
      name: 'Portfolio5FilterList',
      title: 'Filter List',
      fields: [
        {
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          target: 'Image',
        },
        {
          name: 'fullImage',
          title: 'Full Image',
          type: 'json-many-to-one',
          target: 'Image',
        },
        {
          name: 'category',
          title: 'Category',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Portfolio5Data = Data<typeof portfolio5Schema>;

export const portfolio5Demos: Demo<typeof portfolio5Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-24',
    sequence: 4,
    data: {
      portfolio5Description:
        'My interest is taking pictures, and I enjoy transforming thoughts into lovely things.',
      portfolio5Caption: 'My Recent Photographs',
      portfolio5List: [
        {id: '1', version: 0, attrs: {title: 'All', value: '*'}},
        {id: '2', version: 0, attrs: {title: 'Foods', value: '.foods'}},
        {id: '3', version: 0, attrs: {title: 'Drinks', value: '.drinks'}},
        {id: '4', version: 0, attrs: {title: 'Events', value: '.events'}},
        {id: '5', version: 0, attrs: {title: 'Pastries', value: '.pastries'}},
      ],
      portfolio5FilterList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Fringilla Nullam',
            category: 'drinks events',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Fringilla Nullam',
                width: 380,
                height: 254,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Fringilla Nullam',
                width: 760,
                height: 508,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf1-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Ridiculus Parturient',
            category: 'events',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 380,
                height: 294,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 760,
                height: 588,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf2-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ornare Ipsum',
            category: 'pastries events',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Ornare Ipsum',
                width: 380,
                height: 502,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Ornare Ipsum',
                width: 760,
                height: 1004,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf3-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Nullam Mollis',
            category: 'events',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Nullam Mollis',
                width: 380,
                height: 456,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Nullam Mollis',
                width: 760,
                height: 912,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf4-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Euismod Risus',
            category: 'pastries events',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Euismod Risus',
                width: 380,
                height: 305,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Euismod Risus',
                width: 760,
                height: 610,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf5-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Ridiculus Tristique',
            category: 'foods',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 380,
                height: 253,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 760,
                height: 506,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf6-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '7',
          version: 0,
          attrs: {
            title: 'Sollicitudin Pharetra',
            category: 'foods drinks',
            image: {
              id: 'img-7',
              version: 0,
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 380,
                height: 359,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-7',
              version: 0,
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 760,
                height: 718,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf7-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '8',
          version: 0,
          attrs: {
            title: 'Tristique Venenatis',
            category: 'pastries',
            image: {
              id: 'img-8',
              version: 0,
              attrs: {
                alt: 'Tristique Venenatis',
                width: 380,
                height: 254,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-8',
              version: 0,
              attrs: {
                alt: 'Tristique Venenatis',
                width: 760,
                height: 508,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf8-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '9',
          version: 0,
          attrs: {
            title: 'Cursus Fusce',
            category: 'events',
            image: {
              id: 'img-9',
              version: 0,
              attrs: {
                alt: 'Cursus Fusce',
                width: 380,
                height: 284,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-9',
              version: 0,
              attrs: {
                alt: 'Cursus Fusce',
                width: 760,
                height: 568,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf9-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '10',
          version: 0,
          attrs: {
            title: 'Consectetur Malesuada',
            category: 'foods',
            image: {
              id: 'img-10',
              version: 0,
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 380,
                height: 477,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-10',
              version: 0,
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 760,
                height: 954,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf10-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '11',
          version: 0,
          attrs: {
            title: 'Ultricies Aenean',
            category: 'drinks',
            image: {
              id: 'img-11',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 274,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-11',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 760,
                height: 548,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf11-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '12',
          version: 0,
          attrs: {
            title: 'Pellentesque Commodo',
            category: 'foods',
            image: {
              id: 'img-12',
              version: 0,
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 380,
                height: 507,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-12',
              version: 0,
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 760,
                height: 1014,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf12-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12-full.jpg',
                },
              },
            },
          },
        },
        {
          id: '13',
          version: 0,
          attrs: {
            title: 'Ultricies Aenean',
            category: 'drinks',
            image: {
              id: 'img-13',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 391,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf13.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf13.jpg',
                },
              },
            },
            fullImage: {
              id: 'img-13',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 760,
                height: 782,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf13-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf13-full.jpg',
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
    sequence: 4,
    data: {
      portfolio5Description:
        'Mon intérêt est de prendre des photos, et j’aime transformer les pensées en de belles choses.',
      portfolio5Caption: 'Mes photographies récentes',
      portfolio5List: [
        {id: '1', version: 0, attrs: {title: 'Tous', value: '*'}},
        {id: '2', version: 0, attrs: {title: 'Aliments', value: '.foods'}},
        {id: '3', version: 0, attrs: {title: 'Boissons', value: '.drinks'}},
        {id: '4', version: 0, attrs: {title: 'Événements', value: '.events'}},
        {
          id: '5',
          version: 0,
          attrs: {title: 'Pâtisseries', value: '.pastries'},
        },
      ],
      portfolio5FilterList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Fringilla Nullam',
            category: 'drinks events',
            image: {
              id: 'img-1',
              version: 0,
              attrs: {
                alt: 'Fringilla Nullam',
                width: 380,
                height: 254,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1.jpg',
                },
              },
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Ridiculus Parturient',
            category: 'events',
            image: {
              id: 'img-2',
              version: 0,
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 380,
                height: 294,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2.jpg',
                },
              },
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Ornare Ipsum',
            category: 'pastries events',
            image: {
              id: 'img-3',
              version: 0,
              attrs: {
                alt: 'Ornare Ipsum',
                width: 380,
                height: 502,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3.jpg',
                },
              },
            },
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Nullam Mollis',
            category: 'events',
            image: {
              id: 'img-4',
              version: 0,
              attrs: {
                alt: 'Nullam Mollis',
                width: 380,
                height: 456,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4.jpg',
                },
              },
            },
          },
        },
        {
          id: '5',
          version: 0,
          attrs: {
            title: 'Euismod Risus',
            category: 'pastries events',
            image: {
              id: 'img-5',
              version: 0,
              attrs: {
                alt: 'Euismod Risus',
                width: 380,
                height: 305,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5.jpg',
                },
              },
            },
          },
        },
        {
          id: '6',
          version: 0,
          attrs: {
            title: 'Ridiculus Tristique',
            category: 'foods',
            image: {
              id: 'img-6',
              version: 0,
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 380,
                height: 253,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6.jpg',
                },
              },
            },
          },
        },
        {
          id: '7',
          version: 0,
          attrs: {
            title: 'Sollicitudin Pharetra',
            category: 'foods drinks',
            image: {
              id: 'img-7',
              version: 0,
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 380,
                height: 359,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7.jpg',
                },
              },
            },
          },
        },
        {
          id: '8',
          version: 0,
          attrs: {
            title: 'Tristique Venenatis',
            category: 'pastries',
            image: {
              id: 'img-8',
              version: 0,
              attrs: {
                alt: 'Tristique Venenatis',
                width: 380,
                height: 254,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8.jpg',
                },
              },
            },
          },
        },
        {
          id: '9',
          version: 0,
          attrs: {
            title: 'Cursus Fusce',
            category: 'events',
            image: {
              id: 'img-9',
              version: 0,
              attrs: {
                alt: 'Cursus Fusce',
                width: 380,
                height: 284,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9.jpg',
                },
              },
            },
          },
        },
        {
          id: '10',
          version: 0,
          attrs: {
            title: 'Consectetur Malesuada',
            category: 'foods',
            image: {
              id: 'img-10',
              version: 0,
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 380,
                height: 477,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10.jpg',
                },
              },
            },
          },
        },
        {
          id: '11',
          version: 0,
          attrs: {
            title: 'Ultricies Aenean',
            category: 'foods',
            image: {
              id: 'img-11',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 274,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11.jpg',
                },
              },
            },
          },
        },
        {
          id: '12',
          version: 0,
          attrs: {
            title: 'Pellentesque Commodo',
            category: 'foods',
            image: {
              id: 'img-12',
              version: 0,
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 380,
                height: 507,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12.jpg',
                },
              },
            },
          },
        },
        {
          id: '13',
          version: 0,
          attrs: {
            title: 'Ultricies Aenean',
            category: 'foods',
            image: {
              id: 'img-13',
              version: 0,
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 391,
                image: {
                  id: '1',
                  version: 1,
                  fileName: 'pf13.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf13.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
