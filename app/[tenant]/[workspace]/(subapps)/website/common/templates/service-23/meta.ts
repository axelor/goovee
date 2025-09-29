import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service23Schema = {
  title: 'Service 23',
  code: 'service23',
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
      name: 'section1Title',
      title: 'Section 1 Title',
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
      name: 'section1Image',
      title: 'Section 1 Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'section1Services',
      title: 'Section 1 Services',
      type: 'json-one-to-many',
      target: 'Service23Service',
    },
    {
      name: 'section2Title',
      title: 'Section 2 Title',
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
      name: 'section2Image',
      title: 'Section 2 Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'section2Services',
      title: 'Section 2 Services',
      type: 'json-one-to-many',
      target: 'Service23Service',
    },
    {
      name: 'section3Title',
      title: 'Section 3 Title',
      type: 'string',
    },
    {
      name: 'section3Description',
      title: 'Section 3 Description',
      type: 'string',
    },
    {
      name: 'section3LinkTitle',
      title: 'Section 3 Link Title',
      type: 'string',
    },
    {
      name: 'section3LinkHref',
      title: 'Section 3 Link Href',
      type: 'string',
    },
    {
      name: 'section3Image',
      title: 'Section 3 Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'section3Services',
      title: 'Section 3 Services',
      type: 'json-one-to-many',
      target: 'Service23Service',
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
      defaultValue: 'container py-15 py-md-17',
    },
  ],
  models: [
    {
      name: 'Service23Service',
      title: 'Service',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service23Data = Data<typeof service23Schema>;

export const service23Demos: Demo<typeof service23Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-20',
    sequence: 2,
    data: {
      service23Caption: 'What We Do?',
      service23Title:
        'Lighthouse is the only app you need to track your goals for better health.',
      service23Section1Title: 'IoT Development',
      service23Section1Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      service23Section1LinkTitle: 'More Details',
      service23Section1LinkHref: '#',
      service23Section1Image: {
        id: '1',
        version: 1,
        fileName: 'ui4.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui4.png',
      },
      service23Section1Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
      service23Section2Title: 'Artificial Intelligence',
      service23Section2Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      service23Section2LinkTitle: 'More Details',
      service23Section2LinkHref: '#',
      service23Section2Image: {
        id: '1',
        version: 1,
        fileName: 'ui1.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui1.png',
      },
      service23Section2Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
      service23Section3Title: 'Support & Maintenance',
      service23Section3Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      service23Section3LinkTitle: 'More Details',
      service23Section3LinkHref: '#',
      service23Section3Image: {
        id: '1',
        version: 1,
        fileName: 'ui5.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui5.png',
      },
      service23Section3Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-20',
    sequence: 2,
    data: {
      service23Caption: 'Que faisons-nous ?',
      service23Title:
        'Lighthouse est la seule application dont vous avez besoin pour suivre vos objectifs pour une meilleure santé.',
      service23Section1Title: 'Développement IoT',
      service23Section1Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      service23Section1LinkTitle: 'Plus de détails',
      service23Section1LinkHref: '#',
      service23Section1Image: {
        id: '1',
        version: 1,
        fileName: 'ui4.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui4.png',
      },
      service23Section1Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
      service23Section2Title: 'Intelligence artificielle',
      service23Section2Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      service23Section2LinkTitle: 'Plus de détails',
      service23Section2LinkHref: '#',
      service23Section2Image: {
        id: '1',
        version: 1,
        fileName: 'ui1.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui1.png',
      },
      service23Section2Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
      service23Section3Title: 'Support et maintenance',
      service23Section3Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      service23Section3LinkTitle: 'Plus de détails',
      service23Section3LinkHref: '#',
      service23Section3Image: {
        id: '1',
        version: 1,
        fileName: 'ui5.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/ui5.png',
      },
      service23Section3Services: [
        {
          id: '1',
          version: 0,
          attrs: {title: 'Aenean quam ornare curabitur blandit.'},
        },
        {
          id: '2',
          version: 0,
          attrs: {title: 'Nullam quis risus eget urna mollis ornare leo.'},
        },
        {
          id: '3',
          version: 0,
          attrs: {title: 'Etiam porta euismod mollis natoque ornare.'},
        },
      ],
    },
  },
];
