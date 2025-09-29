import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const service17Schema = {
  title: 'Service 17',
  code: 'service17',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'section1Caption',
      title: 'Section 1 Caption',
      type: 'string',
    },
    {
      name: 'section1Description',
      title: 'Section 1 Description',
      type: 'string',
    },
    {
      name: 'section1LinkTitle',
      title: 'Section 1 Link Title',
      type: 'string',
    },
    {
      name: 'section1LinkHref',
      title: 'Section 1 Link Href',
      type: 'string',
    },
    {
      name: 'section2Caption',
      title: 'Section 2 Caption',
      type: 'string',
    },
    {
      name: 'section2Description',
      title: 'Section 2 Description',
      type: 'string',
    },
    {
      name: 'section2LinkTitle',
      title: 'Section 2 Link Title',
      type: 'string',
    },
    {
      name: 'section2LinkHref',
      title: 'Section 2 Link Href',
      type: 'string',
    },
    {
      name: 'image1',
      title: 'Image 1',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'service1',
      title: 'Service 1',
      type: 'json-many-to-one',
      target: 'BulletList',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
    },
    {
      name: 'service2',
      title: 'Service 2',
      type: 'json-many-to-one',
      target: 'BulletList',
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
      defaultValue: 'container pt-14 pt-md-23 pb-14 pb-md-17',
    },
  ],
  models: [bulletListModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service17Data = Data<typeof service17Schema>;

export const service17Demos: Demo<typeof service17Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-14',
    sequence: 2,
    data: {
      service17Caption: 'What We Do',
      service17Title:
        'We create spending relaxed so that you can keep fully in charge.',
      service17Section1Caption: 'Package Design',
      service17Section1Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      service17Section1LinkTitle: 'More Details',
      service17Section1LinkHref: '#',
      service17Section2Caption: 'Corporate Design',
      service17Section2Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      service17Section2LinkTitle: 'More Details',
      service17Section2LinkHref: '#',
      service17Image1: {
        id: '1',
        version: 1,
        fileName: 'se3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se3.jpg',
      },
      service17Image2: {
        id: '1',
        version: 1,
        fileName: 'se4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se4.jpg',
      },
      service17Service1: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList1',
          bulletColor: 'leaf',
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
      service17Service2: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList2',
          bulletColor: 'leaf',
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
    sequence: 2,
    data: {
      service17Caption: 'Ce que nous faisons',
      service17Title:
        'Nous créons des dépenses détendues afin que vous puissiez garder le contrôle total.',
      service17Section1Caption: 'Conception de l’emballage',
      service17Section1Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      service17Section1LinkTitle: 'Plus de détails',
      service17Section1LinkHref: '#',
      service17Section2Caption: 'Conception d’entreprise',
      service17Section2Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      service17Section2LinkTitle: 'Plus de détails',
      service17Section2LinkHref: '#',
      service17Image1: {
        id: '1',
        version: 1,
        fileName: 'se3.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se3.jpg',
      },
      service17Image2: {
        id: '1',
        version: 1,
        fileName: 'se4.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se4.jpg',
      },
      service17Service1: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList1',
          bulletColor: 'leaf',
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
      service17Service2: {
        id: '1',
        version: 0,
        attrs: {
          name: 'serviceList2',
          bulletColor: 'leaf',
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
