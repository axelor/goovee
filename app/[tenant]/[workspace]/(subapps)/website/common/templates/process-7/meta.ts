import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const process7Code = 'process7';

export const process7Schema = {
  title: 'Process 7',
  code: process7Code,
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'para1',
      title: 'Para 1',
      type: 'string',
    },
    {
      name: 'para2',
      title: 'Para 2',
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
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process7Processes',
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
  models: [
    {
      name: 'Process7Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'Number',
          type: 'string',
        },
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'subtitle',
          title: 'Subtitle',
          type: 'string',
        },
        {
          name: 'className',
          title: 'Class Name',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Process7Data = Data<typeof process7Schema>;

export const process7Demos: Demo<typeof process7Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-15',
    sequence: 3,
    data: {
      process7Title:
        'These 3 practical measure will help us organize our company projects.',
      process7Heading: 'How It Works?',
      process7Caption:
        'We are a creative advertising firm that focuses on the influence of great design and creative thinking.',
      process7Para1:
        'Have you ever wondered how much faster your website could be? Find out now by checking your SEO score. A high SEO score means that your website is optimized for search engines, making it more likely to appear at the top of',
      process7Para2:
        "By improving your website's speed, you can provide a better user experience for your visitors, reduce bounce rates, and ultimately increase conversions.",
      process7LinkTitle: 'Learn More',
      process7LinkHref: '#',
      process7Processes: [
        {
          attrs: {
            no: '1',
            title: 'Specialization',
            subtitle: 'This involves focusing on a specific niche of expertise',
            className: 'me-lg-6',
          },
        },
        {
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle: 'This involves focusing on a specific niche expertise',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          attrs: {
            no: '3',
            title: 'Innovation',
            subtitle: 'This involves focusing on a specific niche of expertise',
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-15',
    sequence: 3,
    data: {
      process7Title:
        'Ces 3 mesures pratiques nous aideront à organiser les projets de notre entreprise.',
      process7Heading: 'Comment ça marche ?',
      process7Caption:
        'Nous sommes une agence de publicité créative qui se concentre sur l’influence d’un bon design et d’une pensée créative.',
      process7Para1:
        'Vous êtes-vous déjà demandé à quel point votre site web pourrait être plus rapide ? Découvrez-le maintenant en vérifiant votre score SEO. Un score SEO élevé signifie que votre site web est optimisé pour les moteurs de recherche, ce qui le rend plus susceptible d’apparaître en haut des résultats de recherche.',
      process7Para2:
        'En améliorant la vitesse de votre site web, vous pouvez offrir une meilleure expérience utilisateur à vos visiteurs, réduire les taux de rebond et, finalement, augmenter les conversions.',
      process7LinkTitle: 'En savoir plus',
      process7LinkHref: '#',
      process7Processes: [
        {
          attrs: {
            no: '1',
            title: 'Spécialisation',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique',
            className: 'me-lg-6',
          },
        },
        {
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle:
              'Il s’agit de se concentrer sur une expertise de niche spécifique',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          attrs: {
            no: '3',
            title: 'Innovation',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique',
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
    },
  },
];
