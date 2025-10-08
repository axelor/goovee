import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero18Schema = {
  title: 'Hero 18',
  code: 'hero18',
  type: Template.block,
  fields: [
    {
      name: 'title1',
      title: 'Title 1',
      type: 'string',
    },
    {
      name: 'title2',
      title: 'Title 2',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'buttonLabel',
      title: 'Button Label',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light',
    },
    {
      name: 'containerCardClassName',
      title: 'Container Card Class Name',
      type: 'string',
      defaultValue: 'container-card',
    },
    {
      name: 'cardClassName',
      title: 'Card Class Name',
      type: 'string',
      defaultValue: 'card image-wrapper mt-2 mb-5 overflow-hidden',
    },
    {
      name: 'cardBodyClassName',
      title: 'Card Body Class Name',
      type: 'string',
      defaultValue: 'card-body py-14 px-0 position-relative',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero18Data = Data<typeof hero18Schema>;

export const hero18Demos: Demo<typeof hero18Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-18',
    sequence: 1,
    data: {
      hero18Title1: 'Networking',
      hero18Title2: 'solutions for worldwide communication',
      hero18Description:
        "We're a company that focuses on establishing long-term relationships with customers.",
      hero18ButtonLabel: 'Explore Now',
      hero18ButtonLink: '#',
      hero18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Networking solutions',
          width: 548,
          height: 533,
          image: {
            id: '1',
            version: 1,
            fileName: '3d2.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/3d2.png',
          },
        },
      },
      hero18BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Networking solutions background',
          width: 1372,
          height: 596,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg22.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg22.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-18',
    sequence: 1,
    data: {
      hero18Title1: 'Réseau',
      hero18Title2: 'solutions pour une communication mondiale',
      hero18Description:
        'Nous sommes une entreprise qui se concentre sur l’établissement de relations à long terme avec ses clients.',
      hero18ButtonLabel: 'Explorer maintenant',
      hero18ButtonLink: '#',
      hero18Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Solutions de mise en réseau',
          width: 548,
          height: 533,
          image: {
            id: '1',
            version: 1,
            fileName: '3d2.png',
            fileType: 'image/png',
            filePath: '/img/illustrations/3d2.png',
          },
        },
      },
      hero18BackgroundImage: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Arrière-plan des solutions de mise en réseau',
          width: 1372,
          height: 596,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg22.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg22.png',
          },
        },
      },
    },
  },
];
