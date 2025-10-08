import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';

export const about6Schema = {
  title: 'About 6',
  code: 'about6',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'leadParagraph',
      title: 'Lead Paragraph',
      type: 'string',
    },
    {
      name: 'paragraph',
      title: 'Paragraph',
      type: 'string',
    },
    {
      name: 'image1',
      title: 'Image 1',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'list',
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
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [bulletListModel, imageModel],
} as const satisfies TemplateSchema;

export type About6Data = Data<typeof about6Schema>;

export const about6Demos: Demo<typeof about6Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-15',
    sequence: 2,
    data: {
      about6Title: 'Why Choose Us?',
      about6LeadParagraph:
        'We are a creative advertising firm that focuses on the influence of great design and creative thinking.',
      about6Paragraph:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
      about6Image1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Creative advertising firm',
          width: 396,
          height: 399,
          image: {
            id: '1',
            version: 1,
            fileName: 'about2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about2.jpg',
          },
        },
      },
      about6Image2: {
        id: '2',
        version: 0,
        attrs: {
          alt: 'Creative advertising firm',
          width: 311,
          height: 311,
          image: {
            id: '1',
            version: 1,
            fileName: 'about3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about3.jpg',
          },
        },
      },
      about6List: {
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
                title: 'Aenean eu leo quam ornare curabitur blandit tempus.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare donec elit.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Etiam porta sem malesuada magna mollis euismod.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Fermentum massa vivamus faucibus amet euismod.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-15',
    sequence: 2,
    data: {
      about6Title: 'Pourquoi nous choisir ?',
      about6LeadParagraph:
        'Nous sommes une agence de publicité créative qui se concentre sur l’influence d’un excellent design et d’une pensée créative.',
      about6Paragraph:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui leur permet de se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
      about6Image1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Agence de publicité créative',
          width: 396,
          height: 399,
          image: {
            id: '1',
            version: 1,
            fileName: 'about2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about2.jpg',
          },
        },
      },
      about6Image2: {
        id: '2',
        version: 0,
        attrs: {
          alt: 'Agence de publicité créative',
          width: 311,
          height: 311,
          image: {
            id: '1',
            version: 1,
            fileName: 'about3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about3.jpg',
          },
        },
      },
      about6List: {
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
                title: 'Aenean eu leo quam ornare curabitur blandit tempus.',
              },
            },
            {
              id: '2',
              version: 0,
              attrs: {
                title: 'Nullam quis risus eget urna mollis ornare donec elit.',
              },
            },
            {
              id: '3',
              version: 0,
              attrs: {
                title: 'Etiam porta sem malesuada magna mollis euismod.',
              },
            },
            {
              id: '4',
              version: 0,
              attrs: {
                title: 'Fermentum massa vivamus faucibus amet euismod.',
              },
            },
          ],
        },
      },
    },
  },
];
