import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';
import {metaFileModel} from '../meta-models';
import {buttonColorSelection} from '../meta-selections';

export const about2Schema = {
  title: 'About 2',
  code: 'about2',
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
      name: 'para',
      title: 'Paragraph',
      type: 'string',
    },
    {
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'hideShape',
      title: 'Hide Shape',
      type: 'boolean',
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
      name: 'aboutlist',
      title: 'About List',
      target: 'BulletList',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container mb-14 mb-md-17 mb-lg-19',
    },
  ],
  models: [bulletListModel, imageModel],
  metaModels: [metaFileModel],
  selections: [buttonColorSelection],
} as const satisfies TemplateSchema;

export type About2Data = Data<typeof about2Schema>;

export const about2Demos: Demo<typeof about2Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-2',
    sequence: 6,
    data: {
      about2Caption: 'Who Are We?',
      about2Title: 'We value the creativity of techniques in our company.',
      about2Para:
        'We take great pride in our ability to develop custom solutions that exceed our clients’ expectations and push the boundaries of design. If you are looking for inspiration or want to see what is possible',
      about2Thumbnail: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'About 2 Thumbnail',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about2HideShape: false,
      about2BtnColor: 'white',
      about2Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about2Aboutlist: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
            {
              id: '4',
              version: 0,
              attrs: {title: 'We are a firm that understands the impact'},
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-2',
    sequence: 6,
    data: {
      about2Caption: 'Qui sommes-nous ?',
      about2Title:
        'Nous valorisons la créativité des techniques dans notre entreprise.',
      about2Para:
        'Nous sommes très fiers de notre capacité à développer des solutions personnalisées qui dépassent les attentes de nos clients et repoussent les limites du design. Si vous cherchez l’inspiration ou si vous voulez voir ce qui est possible',
      about2Thumbnail: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'About 2 Thumbnail',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about11.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about11.jpg',
          },
        },
      },
      about2HideShape: false,
      about2BtnColor: 'white',
      about2Media: {
        id: '1',
        version: 1,
        fileName: 'movie.mp4',
        fileType: 'video/mp4',
        filePath: '/media/movie.mp4',
      },
      about2Aboutlist: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'soft-primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Nous sommes une entreprise qui comprend l’impact',
              },
            },
          ],
        },
      },
    },
  },
];
