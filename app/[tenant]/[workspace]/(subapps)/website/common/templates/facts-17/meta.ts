import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const facts17Schema = {
  title: 'Facts 17',
  code: 'facts17',
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
      target: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts17Facts',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue:
        'wrapper position-relative d-lg-flex align-items-center bg-gray min-vh-60 ',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container',
    },
  ],
  models: [
    {
      name: 'Facts17Facts',
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
          name: 'countUp',
          title: 'Count Up',
          type: 'integer',
        },
        {
          name: 'suffix',
          title: 'Suffix',
          type: 'string',
        },
      ],
    },
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Facts17Data = Data<typeof facts17Schema>;

export const facts17Demos: Demo<typeof facts17Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'others',
    sequence: 8,
    data: {
      facts17Title:
        'Just sit & relax while we take care of your business needs.',
      facts17Caption: 'Our Solutions',
      facts17Description:
        'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Praesent commodo cursus. Maecenas sed diam eget risus varius blandit sit amet non magna. Praesent commodo cursus magna.',
      facts17Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Business needs solution',
          width: 2000,
          height: 1400,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg39.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg39.jpg',
          },
        },
      },
      facts17Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Customer Satisfaction',
            countUp: 99,
            suffix: '%',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'New Visitors',
            countUp: 4,
            suffix: 'x',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'others',
    sequence: 8,
    data: {
      facts17Title:
        'Asseyez-vous et détendez-vous pendant que nous nous occupons des besoins de votre entreprise.',
      facts17Caption: 'Nos solutions',
      facts17Description:
        'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Praesent commodo cursus. Maecenas sed diam eget risus varius blandit sit amet non magna. Praesent commodo cursus magna.',
      facts17Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: "Solution aux besoins de l'entreprise",
          width: 2000,
          height: 1400,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg39.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg39.jpg',
          },
        },
      },
      facts17Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Satisfaction du client',
            countUp: 99,
            suffix: '%',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Nouveaux visiteurs',
            countUp: 4,
            suffix: 'x',
          },
        },
      ],
    },
  },
];
