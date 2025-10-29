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
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
        {
          name: 'fullImage',
          title: 'Full Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
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
    site: 'lighthouse-en',
    page: 'demo-24',
    sequence: 4,
    data: {
      portfolio5Description:
        'My interest is taking pictures, and I enjoy transforming thoughts into lovely things.',
      portfolio5Caption: 'My Recent Photographs',
      portfolio5List: [
        {attrs: {title: 'All', value: '*'}},
        {attrs: {title: 'Foods', value: '.foods'}},
        {attrs: {title: 'Drinks', value: '.drinks'}},
        {attrs: {title: 'Events', value: '.events'}},
        {attrs: {title: 'Pastries', value: '.pastries'}},
      ],
      portfolio5FilterList: [
        {
          attrs: {
            title: 'Fringilla Nullam',
            category: 'drinks events',
            image: {
              attrs: {
                alt: 'Fringilla Nullam',
                width: 380,
                height: 254,
                image: {
                  fileName: 'pf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Fringilla Nullam',
                width: 760,
                height: 508,
                image: {
                  fileName: 'pf1-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ridiculus Parturient',
            category: 'events',
            image: {
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 380,
                height: 294,
                image: {
                  fileName: 'pf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 760,
                height: 588,
                image: {
                  fileName: 'pf2-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ornare Ipsum',
            category: 'pastries events',
            image: {
              attrs: {
                alt: 'Ornare Ipsum',
                width: 380,
                height: 502,
                image: {
                  fileName: 'pf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Ornare Ipsum',
                width: 760,
                height: 1004,
                image: {
                  fileName: 'pf3-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Nullam Mollis',
            category: 'events',
            image: {
              attrs: {
                alt: 'Nullam Mollis',
                width: 380,
                height: 456,
                image: {
                  fileName: 'pf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Nullam Mollis',
                width: 760,
                height: 912,
                image: {
                  fileName: 'pf4-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Euismod Risus',
            category: 'pastries events',
            image: {
              attrs: {
                alt: 'Euismod Risus',
                width: 380,
                height: 305,
                image: {
                  fileName: 'pf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Euismod Risus',
                width: 760,
                height: 610,
                image: {
                  fileName: 'pf5-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ridiculus Tristique',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 380,
                height: 253,
                image: {
                  fileName: 'pf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 760,
                height: 506,
                image: {
                  fileName: 'pf6-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Sollicitudin Pharetra',
            category: 'foods drinks',
            image: {
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 380,
                height: 359,
                image: {
                  fileName: 'pf7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 760,
                height: 718,
                image: {
                  fileName: 'pf7-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Tristique Venenatis',
            category: 'pastries',
            image: {
              attrs: {
                alt: 'Tristique Venenatis',
                width: 380,
                height: 254,
                image: {
                  fileName: 'pf8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Tristique Venenatis',
                width: 760,
                height: 508,
                image: {
                  fileName: 'pf8-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Cursus Fusce',
            category: 'events',
            image: {
              attrs: {
                alt: 'Cursus Fusce',
                width: 380,
                height: 284,
                image: {
                  fileName: 'pf9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Cursus Fusce',
                width: 760,
                height: 568,
                image: {
                  fileName: 'pf9-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Consectetur Malesuada',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 380,
                height: 477,
                image: {
                  fileName: 'pf10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 760,
                height: 954,
                image: {
                  fileName: 'pf10-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies Aenean',
            category: 'drinks',
            image: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 274,
                image: {
                  fileName: 'pf11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 760,
                height: 548,
                image: {
                  fileName: 'pf11-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Pellentesque Commodo',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 380,
                height: 507,
                image: {
                  fileName: 'pf12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 760,
                height: 1014,
                image: {
                  fileName: 'pf12-full.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12-full.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies Aenean',
            category: 'drinks',
            image: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 391,
                image: {
                  fileName: 'pf13.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf13.jpg',
                },
              },
            },
            fullImage: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 760,
                height: 782,
                image: {
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
    site: 'lighthouse-fr',
    page: 'demo-24',
    sequence: 4,
    data: {
      portfolio5Description:
        'Mon intérêt est de prendre des photos, et j’aime transformer les pensées en de belles choses.',
      portfolio5Caption: 'Mes photographies récentes',
      portfolio5List: [
        {attrs: {title: 'Tous', value: '*'}},
        {attrs: {title: 'Aliments', value: '.foods'}},
        {attrs: {title: 'Boissons', value: '.drinks'}},
        {attrs: {title: 'Événements', value: '.events'}},
        {
          attrs: {title: 'Pâtisseries', value: '.pastries'},
        },
      ],
      portfolio5FilterList: [
        {
          attrs: {
            title: 'Fringilla Nullam',
            category: 'drinks events',
            image: {
              attrs: {
                alt: 'Fringilla Nullam',
                width: 380,
                height: 254,
                image: {
                  fileName: 'pf1.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf1.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ridiculus Parturient',
            category: 'events',
            image: {
              attrs: {
                alt: 'Ridiculus Parturient',
                width: 380,
                height: 294,
                image: {
                  fileName: 'pf2.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf2.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ornare Ipsum',
            category: 'pastries events',
            image: {
              attrs: {
                alt: 'Ornare Ipsum',
                width: 380,
                height: 502,
                image: {
                  fileName: 'pf3.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf3.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Nullam Mollis',
            category: 'events',
            image: {
              attrs: {
                alt: 'Nullam Mollis',
                width: 380,
                height: 456,
                image: {
                  fileName: 'pf4.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf4.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Euismod Risus',
            category: 'pastries events',
            image: {
              attrs: {
                alt: 'Euismod Risus',
                width: 380,
                height: 305,
                image: {
                  fileName: 'pf5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ridiculus Tristique',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Ridiculus Tristique',
                width: 380,
                height: 253,
                image: {
                  fileName: 'pf6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf6.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Sollicitudin Pharetra',
            category: 'foods drinks',
            image: {
              attrs: {
                alt: 'Sollicitudin Pharetra',
                width: 380,
                height: 359,
                image: {
                  fileName: 'pf7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf7.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Tristique Venenatis',
            category: 'pastries',
            image: {
              attrs: {
                alt: 'Tristique Venenatis',
                width: 380,
                height: 254,
                image: {
                  fileName: 'pf8.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf8.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Cursus Fusce',
            category: 'events',
            image: {
              attrs: {
                alt: 'Cursus Fusce',
                width: 380,
                height: 284,
                image: {
                  fileName: 'pf9.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf9.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Consectetur Malesuada',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Consectetur Malesuada',
                width: 380,
                height: 477,
                image: {
                  fileName: 'pf10.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf10.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies Aenean',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 274,
                image: {
                  fileName: 'pf11.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf11.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Pellentesque Commodo',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Pellentesque Commodo',
                width: 380,
                height: 507,
                image: {
                  fileName: 'pf12.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/pf12.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Ultricies Aenean',
            category: 'foods',
            image: {
              attrs: {
                alt: 'Ultricies Aenean',
                width: 380,
                height: 391,
                image: {
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
