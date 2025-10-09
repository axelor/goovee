import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {colorsSelection} from '../meta-selections';

export const process12Schema = {
  title: 'Process 12',
  code: 'process12',
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'heading',
      title: 'Heading',
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
      target: 'Process12Processes',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper',
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
      name: 'Process12Processes',
      title: 'Processes',
      fields: [
        {
          name: 'no',
          title: 'Number',
          type: 'string',
        },
        {
          name: 'className',
          title: 'Class Name',
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
          name: 'color',
          title: 'Color',
          type: 'string',
          selection: 'colors',
        },
      ],
    },
  ],
  selections: [colorsSelection],
} as const satisfies TemplateSchema;

export type Process12Data = Data<typeof process12Schema>;

export const process12Demos: Demo<typeof process12Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-17',
    sequence: 3,
    data: {
      process12Caption: 'Our Strategy',
      process12Heading:
        'Three practical measure will help us our company projects.',
      process12Para1:
        'Have you ever wondered how much faster your website could be? Find out now by checking your SEO score. A high SEO score means that your website is optimized for search engines, making it more likely to appear at the top of',
      process12Para2:
        "By improving your website's speed, you can provide a better user experience for your visitors, reduce bounce rates, and ultimately increase conversions.",
      process12LinkTitle: 'Learn More',
      process12LinkHref: '#',
      process12Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '01',
            className: '',
            color: 'soft-purple',
            title: 'Specialization',
            subtitle:
              'This involves focusing on a specific niche of expertise.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '02',
            color: 'soft-green',
            title: 'Collaboration',
            className: 'mt-8 ms-lg-10',
            subtitle:
              'This involves focusing on a specific niche of expertise.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            no: '03',
            color: 'soft-orange',
            className: 'mt-8',
            title: 'Innovation',
            subtitle:
              'This involves focusing on a specific niche of expertise.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-17',
    sequence: 3,
    data: {
      process12Caption: 'Notre stratégie',
      process12Heading:
        'Trois mesures pratiques nous aideront dans les projets de notre entreprise.',
      process12Para1:
        'Vous êtes-vous déjà demandé à quel point votre site web pourrait être plus rapide ? Découvrez-le maintenant en vérifiant votre score SEO. Un score SEO élevé signifie que votre site web est optimisé pour les moteurs de recherche, ce qui le rend plus susceptible d’apparaître en haut des résultats de recherche.',
      process12Para2:
        'En améliorant la vitesse de votre site web, vous pouvez offrir une meilleure expérience utilisateur à vos visiteurs, réduire les taux de rebond et, finalement, augmenter les conversions.',
      process12LinkTitle: 'En savoir plus',
      process12LinkHref: '#',
      process12Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            no: '01',
            className: '',
            color: 'soft-purple',
            title: 'Spécialisation',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            no: '02',
            color: 'soft-green',
            title: 'Collaboration',
            className: 'mt-8 ms-lg-10',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            no: '03',
            color: 'soft-orange',
            className: 'mt-8',
            title: 'Innovation',
            subtitle:
              'Il s’agit de se concentrer sur un créneau d’expertise spécifique.',
          },
        },
      ],
    },
  },
];
