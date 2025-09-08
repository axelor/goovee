import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const process14Schema = {
  title: 'Process 14',
  code: 'process14',
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
      target: 'Process14Processes',
    },
  ],
  models: [
    {
      name: 'Process14Processes',
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

export type Process14Data = Data<typeof process14Schema>;

export const process14Demos: Demo<typeof process14Schema>[] = [
  {
    language: 'en_US',
    data: {
      process14Title:
        'These 3 practical measure help us organize company projects.',
      process14Caption: 'Our Strategy',
      process14Para1:
        'Have you ever wondered how much faster your website could be? Find out now by checking your SEO score. A high SEO score means that your website is optimized for search engines, making it more likely to appear at the top of',
      process14Para2:
        "By improving your website's speed, you can provide a better user experience for your visitors, reduce bounce rates, and ultimately increase conversions.",
      process14LinkTitle: 'Learn More',
      process14LinkHref: '#',
      process14Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '1',
            title: 'Specialization',
            subtitle: 'This involves focusing on a specific niche of expertise',
            className: 'me-lg-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle: 'This involves focusing on a specific niche expertise',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '3',
          version: 0,
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
    data: {
      process14Title:
        'Ces 3 mesures pratiques aident notre entreprise à organiser ses projets.',
      process14Caption: 'Notre stratégie',
      process14Para1:
        'Vous êtes-vous déjà demandé à quel point votre site web pourrait être plus rapide ? Découvrez-le maintenant en vérifiant votre score SEO. Un score SEO élevé signifie que votre site web est optimisé pour les moteurs de recherche, ce qui le rend plus susceptible d’apparaître en haut des résultats de recherche.',
      process14Para2:
        'En améliorant la vitesse de votre site web, vous pouvez offrir une meilleure expérience utilisateur à vos visiteurs, réduire les taux de rebond et, finalement, augmenter les conversions.',
      process14LinkTitle: 'En savoir plus',
      process14LinkHref: '#',
      process14Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '1',
            title: 'Spécialisation',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique',
            className: 'me-lg-6',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle:
              'Il s’agit de se concentrer sur une expertise de niche spécifique',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '3',
          version: 0,
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
