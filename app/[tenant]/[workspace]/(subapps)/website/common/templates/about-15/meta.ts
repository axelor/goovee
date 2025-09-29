import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {bulletListModel} from '../json-models';

export const about15Schema = {
  title: 'About 15',
  code: 'about15',
  type: Template.block,
  fields: [
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
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'linkTitle',
      title: 'Link Title',
      type: 'string',
    },
    {
      name: 'linkHref',
      title: 'Link Href',
      type: 'string',
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
      defaultValue: 'container pb-16 pb-md-17',
    },
  ],
  models: [bulletListModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About15Data = Data<typeof about15Schema>;

export const about15Demos: Demo<typeof about15Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-14',
    sequence: 8,
    data: {
      about15Image: {
        id: '1',
        version: 1,
        fileName: 'about19.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about19.jpg',
      },
      about15Caption: 'Why Choose Us?',
      about15Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      about15LinkTitle: 'More Details',
      about15LinkHref: '#',
      about15AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '2',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '3',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
            {
              id: '4',
              version: 0,
              attrs: {title: 'We offer stress-free spending control.'},
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-14',
    sequence: 8,
    data: {
      about15Image: {
        id: '1',
        version: 1,
        fileName: 'about19.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about19.jpg',
      },
      about15Caption: 'Pourquoi nous choisir ?',
      about15Description:
        'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client.',
      about15LinkTitle: 'Plus de détails',
      about15LinkHref: '#',
      about15AboutList: {
        id: '1',
        version: 0,
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
          list: [
            {
              id: '1',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Nous offrons un contrôle des dépenses sans stress.',
              },
            },
            {
              id: '4',
              version: 0,
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
