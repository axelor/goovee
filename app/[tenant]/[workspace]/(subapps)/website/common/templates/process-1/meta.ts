import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const process1Code = 'process1';

export const process1Schema = {
  title: 'Process 1',
  code: process1Code,
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
      name: 'description1',
      title: 'Description 1',
      type: 'string',
    },
    {
      name: 'description2',
      title: 'Description 2',
      type: 'string',
    },
    {
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
    },
    {
      name: 'link',
      title: 'Link',
      type: 'string',
    },
    {
      name: 'processList',
      title: 'Process List',
      type: 'json-one-to-many',
      target: 'Process1ProcessList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-light angled upper-start',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-14 pt-md-17',
    },
  ],
  models: [
    {
      name: 'Process1ProcessList',
      title: 'Process 1 Process List',
      fields: [
        {
          name: 'no',
          title: 'Number',
          type: 'string',
          required: true,
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
          visibleInGrid: true,
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

export type Process1Data = Data<typeof process1Schema>;

export const process1Demos: Demo<typeof process1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-1',
    sequence: 4,
    data: {
      process1Link: '#',
      process1Title: 'Our Strategy',
      process1Caption:
        'These 3 practical measure will help us organize our company projects.',
      process1LinkText: 'Learn More',
      process1ProcessList: [
        {
          id: '8',
          version: 1,
          attrs: {
            no: '1',
            title: 'Specialization',
            subtitle: 'This involves focusing on a specific niche of expertise',
            className: 'me-lg-6',
          },
        },
        {
          id: '9',
          version: 1,
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle: 'This involves focusing on a specific niche expertise',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '10',
          version: 1,
          attrs: {
            no: '3',
            title: 'Innovation',
            subtitle: 'This involves focusing on a specific niche of expertise',
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
      process1Description1:
        'Have you ever wondered how much faster your website could be? Find out now by checking your SEO score. A high SEO score means that your website is optimized for search engines, making it more likely to appear at the top of',
      process1Description2:
        "By improving your website's speed, you can provide a better user experience for your visitors, reduce bounce rates, and ultimately increase conversions.",
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-1',
    sequence: 4,
    data: {
      process1Link: '#',
      process1Title: 'Notre stratégie',
      process1Caption:
        'Ces 3 mesures pratiques nous aideront à organiser les projets de notre entreprise.',
      process1LinkText: 'En savoir plus',
      process1ProcessList: [
        {
          id: '8',
          version: 1,
          attrs: {
            no: '1',
            title: 'Spécialisation',
            subtitle:
              "Cela implique de se concentrer sur un créneau d'expertise spécifique",
            className: 'me-lg-6',
          },
        },
        {
          id: '9',
          version: 1,
          attrs: {
            no: '2',
            title: 'Collaboration',
            subtitle:
              'Cela implique de se concentrer sur une expertise de niche spécifique',
            className: 'ms-lg-13 mt-6',
          },
        },
        {
          id: '10',
          version: 1,
          attrs: {
            no: '3',
            title: 'Innovation',
            subtitle:
              "Cela implique de se concentrer sur un créneau d'expertise spécifique",
            className: 'mx-lg-6 mt-6',
          },
        },
      ],
      process1Description1:
        "Vous êtes-vous déjà demandé à quel point votre site web pourrait être plus rapide ? Découvrez-le maintenant en vérifiant votre score SEO. Un score SEO élevé signifie que votre site web est optimisé pour les moteurs de recherche, ce qui le rend plus susceptible d'apparaître en haut des résultats de recherche.",
      process1Description2:
        'En améliorant la vitesse de votre site web, vous pouvez offrir une meilleure expérience utilisateur à vos visiteurs, réduire les taux de rebond et, finalement, augmenter les conversions.',
    },
  },
];
