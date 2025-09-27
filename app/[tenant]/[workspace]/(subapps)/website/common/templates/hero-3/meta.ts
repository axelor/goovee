import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const hero3Schema = {
  title: 'Hero 3',
  code: 'hero3',
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Hero3Data = Data<typeof hero3Schema>;

export const hero3Demos: Demo<typeof hero3Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero3Title: 'We specialize in',
      hero3Description:
        'We carefully analyze the best ways to help every stage of the development process.',
      hero3ButtonLabel: 'Get Started',
      hero3ButtonLink: '#',
      hero3Image: {
        id: '1',
        version: 1,
        fileName: 'about13.png',
        fileType: 'image/png',
        filePath: '/img/photos/about13.png',
      },
      hero3Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero3Typewriter: [
        {id: '1', version: 0, attrs: {text: 'revolutionary ideas.'}},
        {id: '2', version: 0, attrs: {text: 'business needs'}},
        {id: '3', version: 0, attrs: {text: 'creative ideas'}},
      ],
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero3Title: 'Nous sommes spécialisés dans',
      hero3Description:
        'Nous analysons attentivement les meilleures façons d’aider à chaque étape du processus de développement.',
      hero3ButtonLabel: 'Commencer',
      hero3ButtonLink: '#',
      hero3Image: {
        id: '1',
        version: 1,
        fileName: 'about13.png',
        fileType: 'image/png',
        filePath: '/img/photos/about13.png',
      },
      hero3Video: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      hero3Typewriter: [
        {id: '1', version: 0, attrs: {text: 'idées révolutionnaires.'}},
        {id: '2', version: 0, attrs: {text: 'besoins des entreprises'}},
        {id: '3', version: 0, attrs: {text: 'idées créatives'}},
      ],
    },
  },
];
