import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {serviceList3Model, imageModel} from '../json-models';

export const about9Code = 'about9';

export const about9Schema = {
  title: 'About 9',
  code: about9Code,
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
      name: 'aboutList',
      title: 'About List',
      type: 'json-one-to-many',
      target: 'ServiceList3',
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
  models: [serviceList3Model, imageModel],
} as const satisfies TemplateSchema;

export type About9Data = Data<typeof about9Schema>;

export const about9Demos: Demo<typeof about9Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-8',
    sequence: 3,
    data: {
      about9Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Creative advertising firm',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about10.jpg',
          },
        },
      },
      about9Caption: 'Discover Our Company',
      about9Title:
        'We are a creative advertising firm that focuses on the influence of great design and creative thinking.',
      about9Description:
        'A community refers to a group of people who share common interests, beliefs, values, or goals and interact with one another in a shared location or virtual space. Communities can be found in various forms.',
      about9AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Our Mission',
            description: 'The influence of great design and creative thinking',
            icon: 'Rocket',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Our Values',
            description: 'The influence of great design and creative thinking',
            icon: 'Shield',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-8',
    sequence: 3,
    data: {
      about9Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Agence de publicité créative',
          width: 585,
          height: 425,
          image: {
            id: '1',
            version: 1,
            fileName: 'about10.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about10.jpg',
          },
        },
      },
      about9Caption: 'Découvrez notre entreprise',
      about9Title:
        'Nous sommes une agence de publicité créative qui se concentre sur l’influence d’un bon design et d’une pensée créative.',
      about9Description:
        'Une communauté fait référence à un groupe de personnes qui partagent des intérêts, des croyances, des valeurs ou des objectifs communs et interagissent les uns avec les autres dans un lieu partagé ou un espace virtuel. Les communautés peuvent être trouvées sous diverses formes.',
      about9AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Notre mission',
            description: 'L’influence d’un bon design et d’une pensée créative',
            icon: 'Rocket',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Nos valeurs',
            description: 'L’influence d’un bon design et d’une pensée créative',
            icon: 'Shield',
          },
        },
      ],
    },
  },
];
