import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {bulletListModel, imageModel} from '../json-models';
import {buttonColorSelection} from '../meta-selections';

export const about13Code = 'about13';

export const about13Schema = {
  title: 'About 13',
  code: about13Code,
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
      name: 'description',
      title: 'Description',
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
      name: 'aboutList',
      title: 'About List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
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
      defaultValue: 'container pt-14 pt-md-17 mb-14 mb-md-18',
    },
  ],
  models: [bulletListModel, imageModel],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection],
} as const satisfies TemplateSchema;

export type About13Data = Data<typeof about13Schema>;

export const about13Demos: Demo<typeof about13Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-11',
    sequence: 7,
    data: {
      about13Image: {
        attrs: {
          alt: 'Company strategies and achievement',
          width: 585,
          height: 425,
          image: {
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about13Caption: 'Who Are We?',
      about13Title:
        'The organization that thinks about the efficacy of strategies.',
      about13Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
      about13BtnColor: 'white',
      about13Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about13HideShape: false,
      about13AboutList: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              attrs: {title: 'We offer stress-free spending control.'},
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-11',
    sequence: 7,
    data: {
      about13Image: {
        attrs: {
          alt: "Stratégies et réalisation de l'entreprise",
          width: 585,
          height: 425,
          image: {
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about13Caption: 'Qui sommes-nous ?',
      about13Title: 'L’organisation qui pense à l’efficacité des stratégies.',
      about13Description:
        'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
      about13BtnColor: 'white',
      about13Media: {
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about13HideShape: false,
      about13AboutList: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
          ],
        },
      },
    },
  },
];
