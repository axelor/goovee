import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const hero19Code = 'hero19';

export const hero19Schema = {
  title: 'Hero 19',
  code: hero19Code,
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
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper image-wrapper bg-image bg-overlay bg-overlay-300 text-white',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-17 pb-19 pt-md-18 pb-md-17 text-center',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Hero19Data = Data<typeof hero19Schema>;

export const hero19Demos: Demo<typeof hero19Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-19',
    sequence: 1,
    data: {
      hero19Title1: 'We provide quick solutions for your',
      hero19Title2: 'company',
      hero19Description:
        'We are a creative company that focuses on long term relationships with customers.',
      hero19ButtonLabel: 'Read More',
      hero19ButtonLink: '#',
      hero19BackgroundImage: {
        attrs: {
          alt: 'Quick solutions background',
          width: 1440,
          height: 674,
          image: {
            fileName: 'bg16.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg16.png',
          },
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-19',
    sequence: 1,
    data: {
      hero19Title1: 'Nous apportons des solutions rapides pour votre',
      hero19Title2: 'entreprise',
      hero19Description:
        'Nous sommes une entreprise créative qui se concentre sur les relations à long terme avec les clients.',
      hero19ButtonLabel: 'Lire la suite',
      hero19ButtonLink: '#',
      hero19BackgroundImage: {
        attrs: {
          alt: 'Arrière-plan des solutions rapides',
          width: 1440,
          height: 674,
          image: {
            fileName: 'bg16.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg16.png',
          },
        },
      },
    },
  },
];
