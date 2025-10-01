import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero11Schema = {
  title: 'Hero 11',
  code: 'hero11',
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
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
      type: 'string',
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'videoHref',
      title: 'Video Href',
      type: 'string',
    },
    {
      name: 'carouselImages',
      title: 'Carousel Images',
      type: 'json-one-to-many',
      target: 'Hero11CarouselImages',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-image bg-overlay bg-overlay-400 bg-content text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-18 pb-16',
    },
  ],
  models: [
    {
      name: 'Hero11CarouselImages',
      title: 'Carousel Images',
      fields: [
        {
          name: 'name',
          title: 'Name',
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
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero11Data = Data<typeof hero11Schema>;

export const hero11Demos: Demo<typeof hero11Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-11',
    sequence: 1,
    data: {
      hero11Title: 'Expertise in creating specific project solutions.',
      hero11Description:
        'We offer an innovative organization that promotes permanent relationships with clients.',
      hero11ButtonLabel1: 'Explore Now',
      hero11ButtonLabel2: 'Contact Us',
      hero11ButtonLink1: '#',
      hero11ButtonLink2: '#',
      hero11BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg4.jpg',
      },
      hero11VideoHref: '/media/movie.mp4',
      hero11CarouselImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'about21',
            image: {
              id: '1',
              version: 1,
              fileName: 'about21.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about21.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'about22',
            image: {
              id: '1',
              version: 1,
              fileName: 'about22.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about22.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'about23',
            image: {
              id: '1',
              version: 1,
              fileName: 'about23.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about23.jpg',
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-11',
    sequence: 1,
    data: {
      hero11Title:
        'Expertise dans la création de solutions de projets spécifiques.',
      hero11Description:
        'Nous sommes une organisation innovante qui favorise les relations permanentes avec les clients.',
      hero11ButtonLabel1: 'Explorer maintenant',
      hero11ButtonLabel2: 'Contactez-nous',
      hero11ButtonLink1: '#',
      hero11ButtonLink2: '#',
      hero11BackgroundImage: {
        id: '1',
        version: 1,
        fileName: 'bg4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg4.jpg',
      },
      hero11VideoHref: '/media/movie.mp4',
      hero11CarouselImages: [
        {
          id: '1',
          version: 0,
          attrs: {
            name: 'about21',
            image: {
              id: '1',
              version: 1,
              fileName: 'about21.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about21.jpg',
            },
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            name: 'about22',
            image: {
              id: '1',
              version: 1,
              fileName: 'about22.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about22.jpg',
            },
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            name: 'about23',
            image: {
              id: '1',
              version: 1,
              fileName: 'about23.jpg',
              fileType: 'image/jpeg',
              filePath: '/img/photos/about23.jpg',
            },
          },
        },
      ],
    },
  },
];
