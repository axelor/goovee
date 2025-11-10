import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero23Code = 'hero23';

export const hero23Schema = {
  title: 'Hero 23',
  code: hero23Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'slideImages',
      title: 'Slide Images',
      type: 'json-one-to-many',
      target: 'Hero23SlideImages',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-dark',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue:
        'container h-100 d-flex align-items-center justify-content-center',
    },
  ],
  models: [
    {
      name: 'Hero23SlideImages',
      title: 'Slide Images',
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
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
        {
          name: 'thumb',
          title: 'Thumbnail Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Hero23Data = Data<typeof hero23Schema>;

export const hero23Demos: Demo<typeof hero23Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-23',
    sequence: 1,
    data: {
      hero23Title: 'Capturing Life with Lighthouse',
      hero23Caption: "Hello! I'm Jhon",
      hero23SlideImages: [
        {
          attrs: {
            title: 'Slide 1',
            image: {
              attrs: {
                alt: 'Slide background',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg30.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg30.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Slide thumbnail',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg30-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg30-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 2',
            image: {
              attrs: {
                alt: 'Slide background',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg29.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg29.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Slide thumbnail',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg29-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg29-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 3',
            image: {
              attrs: {
                alt: 'Slide background',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg28.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg28.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Slide thumbnail',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg28-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg28-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 4',
            image: {
              attrs: {
                alt: 'Slide background',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg31.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg31.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Slide thumbnail',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg31-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg31-th.jpg',
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
    page: 'demo-23',
    sequence: 1,
    data: {
      hero23Title: 'Capturer la vie avec Lighthouse',
      hero23Caption: 'Bonjour ! Je suis Jhon',
      hero23SlideImages: [
        {
          attrs: {
            title: 'Slide 1',
            image: {
              attrs: {
                alt: 'Fond de diapositive',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg30.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg30.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Vignette de la diapositive',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg30-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg30-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 2',
            image: {
              attrs: {
                alt: 'Fond de diapositive',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg29.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg29.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Vignette de la diapositive',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg29-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg29-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 3',
            image: {
              attrs: {
                alt: 'Fond de diapositive',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg28.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg28.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Vignette de la diapositive',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg28-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg28-th.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            title: 'Slide 4',
            image: {
              attrs: {
                alt: 'Fond de diapositive',
                width: 2000,
                height: 1333,
                image: {
                  fileName: 'bg31.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg31.jpg',
                },
              },
            },
            thumb: {
              attrs: {
                alt: 'Vignette de la diapositive',
                width: 50,
                height: 50,
                image: {
                  fileName: 'bg31-th.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/bg31-th.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
