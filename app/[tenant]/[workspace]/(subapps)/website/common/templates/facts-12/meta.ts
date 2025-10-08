import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const facts12Schema = {
  title: 'Facts 12',
  code: 'facts12',
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
      target: 'Image',
    },
    {
      name: 'facts',
      title: 'Facts',
      type: 'json-one-to-many',
      target: 'Facts12Facts',
    },
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'wrapper',
    },
    {
      name: 'containerCardClassName',
      title: 'Container Card Class Name',
      type: 'string',
      defaultValue: 'container-card',
    },
    {
      name: 'cardClassName',
      title: 'Card Class Name',
      type: 'string',
      defaultValue: 'card image-wrapper bg-full pb-15',
    },
    {
      name: 'cardBodyClassName',
      title: 'Card Body Class Name',
      type: 'string',
      defaultValue: 'card-body py-14 px-0 relative',
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
      name: 'Facts12Facts',
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

export type Facts12Data = Data<typeof facts12Schema>;

export const facts12Demos: Demo<typeof facts12Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-18',
    sequence: 5,
    data: {
      facts12Title: 'We feel proud of our achievements.',
      facts12Caption:
        'We bring solutions to make life easier for our customers.',
      facts12Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Company achievements',
          width: 1372,
          height: 596,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg22.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg22.png',
          },
        },
      },
      facts12Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Completed Projects',
            countUp: 10,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Happy Clients',
            countUp: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Awards Won',
            countUp: 265,
            suffix: '+',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-18',
    sequence: 5,
    data: {
      facts12Title: 'Nous sommes fiers de nos réalisations.',
      facts12Caption:
        'Nous apportons des solutions pour faciliter la vie de nos clients.',
      facts12Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: "Réalisations de l'entreprise",
          width: 1372,
          height: 596,
          image: {
            id: '1',
            version: 1,
            fileName: 'bg22.png',
            fileType: 'image/png',
            filePath: '/img/photos/bg22.png',
          },
        },
      },
      facts12Facts: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Projets terminés',
            countUp: 10,
            suffix: 'K+',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Clients heureux',
            countUp: 5,
            suffix: 'K+',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Récompenses gagnées',
            countUp: 265,
            suffix: '+',
          },
        },
      ],
    },
  },
];
