import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {progressListModel, imageModel} from '../json-models';
import {metaFileModel} from '../meta-models';
import {buttonColorSelection} from '../meta-selections';

export const about10Code = 'about10';

export const about10Schema = {
  title: 'About 10',
  code: about10Code,
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
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'btnColor',
      title: 'Button Color',
      type: 'string',
      selection: 'button-colors',
    },
    {
      name: 'media',
      title: 'Media',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'binary-link',
      widgetAttrs: {'x-accept': 'video/*'},
    },
    {
      name: 'hideShape',
      title: 'Hide Shape',
      type: 'boolean',
    },
    {
      name: 'progressList',
      title: 'Progress List',
      target: 'ProgressList',
      type: 'json-one-to-many',
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
      defaultValue: 'container mb-14 mb-md-18',
    },
  ],
  models: [progressListModel, imageModel],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection],
} as const satisfies TemplateSchema;

export type About10Data = Data<typeof about10Schema>;

export const about10Demos: Demo<typeof about10Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-8',
    sequence: 8,
    data: {
      about10Image: {
        attrs: {
          alt: 'Strategies for achievement',
          width: 585,
          height: 425,
          image: {
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about10Caption: 'The Lighthouse is Fabulous',
      about10Title:
        'We designed our strategies to help you at each stage of achievement.',
      about10BtnColor: 'white',
      about10Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about10HideShape: false,
      about10ProgressList: [
        {
          attrs: {
            title: 'Marketing',
            percent: 100,
            color: 'blue',
          },
        },
        {
          attrs: {
            title: 'Strategy',
            percent: 80,
            color: 'yellow',
          },
        },
        {
          attrs: {
            title: 'Development',
            percent: 85,
            color: 'orange',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-8',
    sequence: 8,
    data: {
      about10Image: {
        attrs: {
          alt: 'Stratégies de réussite',
          width: 585,
          height: 425,
          image: {
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about10Caption: 'Le phare est fabuleux',
      about10Title:
        'Nous avons conçu nos stratégies pour vous aider à chaque étape de votre réussite.',
      about10BtnColor: 'white',
      about10Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about10HideShape: false,
      about10ProgressList: [
        {
          attrs: {
            title: 'Marketing',
            percent: 100,
            color: 'blue',
          },
        },
        {
          attrs: {
            title: 'Stratégie',
            percent: 80,
            color: 'yellow',
          },
        },
        {
          attrs: {
            title: 'Développement',
            percent: 85,
            color: 'orange',
          },
        },
      ],
    },
  },
];
