import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const hero3Code = 'hero3';

export const hero3Schema = {
  title: 'Hero 3',
  code: hero3Code,
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
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'video',
      title: 'Video',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'typewriter',
      title: 'Typewriter',
      type: 'json-one-to-many',
      target: 'Hero3Typewriter',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-dark angled lower-start',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-7 pt-md-11 pb-8',
    },
  ],
  models: [
    {
      name: 'Hero3Typewriter',
      title: 'Typewriter',
      fields: [
        {
          name: 'text',
          title: 'Text',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    imageModel,
  ],

  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero3Data = Data<typeof hero3Schema>;

export const hero3Demos: Demo<typeof hero3Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-3',
    sequence: 1,
    data: {
      hero3Title: 'We specialize in',
      hero3Description:
        'We carefully analyze the best ways to help every stage of the development process.',
      hero3ButtonLabel: 'Get Started',
      hero3ButtonLink: '#',
      hero3Image: {
        attrs: {
          alt: 'Specialized in',
          width: 500,
          height: 552,
          image: {
            fileName: 'about13.png',
            fileType: 'image/png',
            filePath: '/img/photos/about13.png',
          },
        },
      },
      hero3Video: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero3Typewriter: [
        {attrs: {text: 'revolutionary ideas.'}},
        {attrs: {text: 'business needs'}},
        {attrs: {text: 'creative ideas'}},
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-3',
    sequence: 1,
    data: {
      hero3Title: 'Nous sommes spécialisés dans',
      hero3Description:
        'Nous analysons attentivement les meilleures façons d’aider à chaque étape du processus de développement.',
      hero3ButtonLabel: 'Commencer',
      hero3ButtonLink: '#',
      hero3Image: {
        attrs: {
          alt: 'Specialized in',
          width: 500,
          height: 552,
          image: {
            fileName: 'about13.png',
            fileType: 'image/png',
            filePath: '/img/photos/about13.png',
          },
        },
      },
      hero3Video: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero3Typewriter: [
        {attrs: {text: 'idées révolutionnaires.'}},
        {attrs: {text: 'besoins des entreprises'}},
        {attrs: {text: 'idées créatives'}},
      ],
    },
  },
];
