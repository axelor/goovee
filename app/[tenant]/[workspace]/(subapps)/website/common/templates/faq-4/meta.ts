import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const faq4Code = 'faq4';

export const faq4Schema = {
  title: 'FAQ 4',
  code: faq4Code,
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Faq4Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper mt-md-n50p',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-14 pt-md-0 mb-14 mb-md-7',
    },
  ],
  models: [
    {
      name: 'Faq4Facts',
      title: 'Facts',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'amount',
          title: 'Amount',
          type: 'integer',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Faq4Data = Data<typeof faq4Schema>;

export const faq4Demos: Demo<typeof faq4Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-11',
    sequence: 5,
    data: {
      faq4Image: {
        attrs: {
          alt: 'Company facts background',
          width: 1440,
          height: 680,
          image: {
            fileName: 'bg2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg2.jpg',
          },
        },
      },
      faq4Facts: [
        {
          attrs: {
            title: 'Completed Projects',
            amount: 7518,
          },
        },
        {
          attrs: {
            title: 'Satisfied Customers',
            amount: 3472,
          },
        },
        {
          attrs: {
            title: 'Expert Employees',
            amount: 2184,
          },
        },
        {
          attrs: {
            title: 'Awards Won',
            amount: 4523,
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-11',
    sequence: 5,
    data: {
      faq4Image: {
        attrs: {
          alt: "Arrière-plan des faits sur l'entreprise",
          width: 1440,
          height: 680,
          image: {
            fileName: 'bg2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg2.jpg',
          },
        },
      },
      faq4Facts: [
        {
          attrs: {
            title: 'Projets terminés',
            amount: 7518,
          },
        },
        {
          attrs: {
            title: 'Clients satisfaits',
            amount: 3472,
          },
        },
        {
          attrs: {
            title: 'Employés experts',
            amount: 2184,
          },
        },
        {
          attrs: {
            title: 'Récompenses gagnées',
            amount: 4523,
          },
        },
      ],
    },
  },
];
