import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const contact8Schema = {
  title: 'Contact 8',
  code: 'contact8',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
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
      name: 'tileImage1',
      title: 'Tile Image 1',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'tileImage2',
      title: 'Tile Image 2',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
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
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled lower-end',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-14 pb-md-16',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Contact8Data = Data<typeof contact8Schema>;

export const contact8Demos: Demo<typeof contact8Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-13',
    sequence: 9,
    data: {
      contact8Title: 'Get in Touch',
      contact8Description:
        "Our portfolio is filled with a diverse range of works that highlight our creativity and innovation. We take great pride in our ability to develop custom solutions that exceed our clients' expectations and push the boundaries of design.",
      contact8Caption:
        'Grow your business with our proven track record of success and join our community of our 5K+ satisfied clients and partner.',
      contact8LinkTitle: 'Join Us',
      contact8LinkHref: '#',
      contact8TileImage1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Grow your business',
          width: 465,
          height: 533,
          image: {
            id: '1',
            version: 1,
            fileName: 'about4.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about4.jpg',
          },
        },
      },
      contact8TileImage2: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Grow your business',
          width: 1200,
          height: 650,
          image: {
            id: '1',
            version: 1,
            fileName: 'about5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about5.jpg',
          },
        },
      },
      contact8Heading: 'Satisfied Clients',
      contact8CountUp: 5000,
      contact8Suffix: '+',
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-13',
    sequence: 9,
    data: {
      contact8Title: 'Entrer en contact',
      contact8Description:
        'Notre portefeuille est rempli d’un large éventail de travaux qui mettent en valeur notre créativité et notre innovation. Nous sommes très fiers de notre capacité à développer des solutions personnalisées qui dépassent les attentes de nos clients et repoussent les limites du design.',
      contact8Caption:
        'Développez votre entreprise grâce à nos antécédents de réussite éprouvés et rejoignez notre communauté de plus de 5 000 clients et partenaires satisfaits.',
      contact8LinkTitle: 'Rejoignez-nous',
      contact8LinkHref: '#',
      contact8TileImage1: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Développez votre entreprise',
          width: 465,
          height: 533,
          image: {
            id: '1',
            version: 1,
            fileName: 'about4.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about4.jpg',
          },
        },
      },
      contact8TileImage2: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'Développez votre entreprise',
          width: 1200,
          height: 650,
          image: {
            id: '1',
            version: 1,
            fileName: 'about5.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/about5.jpg',
          },
        },
      },
      contact8Heading: 'Clients satisfaits',
      contact8CountUp: 5000,
      contact8Suffix: '+',
    },
  },
];
