import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const about15Code = 'about15';

export const about15Schema = {
  title: 'About 15',
  code: about15Code,
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
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
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
  models: [bulletListModel, imageModel],
} as const satisfies TemplateSchema;

export type About15Data = Data<typeof about15Schema>;

export const about15Demos: Demo<typeof about15Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-14',
    sequence: 8,
    data: {
      about15Image: {
        attrs: {
          alt: 'Why Choose Us?',
          width: 566,
          height: 458,
          image: {
            fileName: 'about19.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about19.jpg',
          },
        },
      },
      about15Caption: 'Why Choose Us?',
      about15Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      about15LinkTitle: 'More Details',
      about15LinkHref: '#',
      about15AboutList: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
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
    page: 'demo-14',
    sequence: 8,
    data: {
      about15Image: {
        attrs: {
          alt: 'Pourquoi nous choisir ?',
          width: 566,
          height: 458,
          image: {
            fileName: 'about19.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about19.jpg',
          },
        },
      },
      about15Caption: 'Pourquoi nous choisir ?',
      about15Description:
        'Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous fournissez un excellent service client.',
      about15LinkTitle: 'Plus de détails',
      about15LinkHref: '#',
      about15AboutList: {
        attrs: {
          name: 'aboutlist',
          bulletColor: 'primary',
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
