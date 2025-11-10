import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {bulletListModel, imageModel} from '../json-models';
import {solidIconsSelection} from '../meta-selections';

export const service5Code = 'service5';

export const service5Schema = {
  title: 'Service 5',
  code: service5Code,
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
      name: 'experience',
      title: 'Experience',
      type: 'integer',
    },
    {
      name: 'experienceSuffix',
      title: 'Experience Suffix',
      type: 'string',
    },
    {
      name: 'experienceDescription',
      title: 'Experience Description',
      type: 'string',
    },
    {
      name: 'image1',
      title: 'Image 1',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'image3',
      title: 'Image 3',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'services',
      title: 'Services',
      type: 'json-one-to-many',
      target: 'Service5Service',
    },
    {
      name: 'features',
      title: 'Features',
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
      defaultValue: 'container pt-14 pt-md-18 mb-14 mb-md-17',
    },
  ],
  models: [
    {
      name: 'Service5Service',
      title: 'Service',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'description',
          title: 'Description',
          type: 'string',
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
      ],
    },
    bulletListModel,
    imageModel,
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service5Data = Data<typeof service5Schema>;

export const service5Demos: Demo<typeof service5Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-4',
    sequence: 2,
    data: {
      service5Title:
        "Our goal is to develop solutions that make our clients' life easier.",
      service5Description:
        'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention.',
      service5Experience: 20,
      service5ExperienceSuffix: '+',
      service5ExperienceDescription: 'Year Experience',
      service5Image1: {
        attrs: {
          alt: 'Company value proposition',
          width: 240,
          height: 245,
          image: {
            fileName: 'ab1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab1.jpg',
          },
        },
      },
      service5Image2: {
        attrs: {
          alt: 'Company value proposition',
          width: 290,
          height: 225,
          image: {
            fileName: 'ab2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab2.jpg',
          },
        },
      },
      service5Image3: {
        attrs: {
          alt: 'Company value proposition',
          width: 290,
          height: 440,
          image: {
            fileName: 'ab3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab3.jpg',
          },
        },
      },
      service5Services: [
        {
          attrs: {
            icon: 'DevicesThree',
            title: 'IoT Development',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          attrs: {
            icon: 'AI',
            title: 'Artificial Intelligence',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          attrs: {
            icon: 'Setting',
            title: 'Software Maintenance',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          attrs: {
            icon: 'Shield',
            title: 'Cybersecurity',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          attrs: {
            icon: 'Rocket',
            title: 'IT Consulting',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
        {
          attrs: {
            icon: 'Cart',
            title: 'E-commerce Solutions',
            description:
              'IoT development, devices are connected to the internet and data to provide useful services and automate processes.',
          },
        },
      ],
      service5Features: {
        attrs: {
          name: 'features',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title:
                  'Customers may choose company offer high-quality product.',
              },
            },
            {
              attrs: {
                title:
                  'Customers may choose company offer high-quality product.',
              },
            },
            {
              attrs: {
                title:
                  'Customers may choose company offer high-quality product.',
              },
            },
            {
              attrs: {
                title:
                  'Customers may choose company offer high-quality product.',
              },
            },
          ],
        },
      },
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-4',
    sequence: 2,
    data: {
      service5Title:
        'Notre objectif est de développer des solutions qui facilitent la vie de nos clients.',
      service5Description:
        'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui les fait se sentir valorisés et appréciés. Cela peut inclure des temps de réponse rapides, une attention personnalisée.',
      service5Experience: 20,
      service5ExperienceSuffix: '+',
      service5ExperienceDescription: 'Année d’expérience',
      service5Image1: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 240,
          height: 245,
          image: {
            fileName: 'ab1.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab1.jpg',
          },
        },
      },
      service5Image2: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 290,
          height: 225,
          image: {
            fileName: 'ab2.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab2.jpg',
          },
        },
      },
      service5Image3: {
        attrs: {
          alt: "Proposition de valeur de l'entreprise",
          width: 290,
          height: 440,
          image: {
            fileName: 'ab3.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/ab3.jpg',
          },
        },
      },
      service5Services: [
        {
          attrs: {
            icon: 'DevicesThree',
            title: 'Développement IoT',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          attrs: {
            icon: 'AI',
            title: 'Intelligence artificielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          attrs: {
            icon: 'Setting',
            title: 'Maintenance logicielle',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          attrs: {
            icon: 'Shield',
            title: 'Cybersécurité',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          attrs: {
            icon: 'Rocket',
            title: 'Conseil en informatique',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
        {
          attrs: {
            icon: 'Cart',
            title: 'Solutions de commerce électronique',
            description:
              'Le développement IoT, les appareils sont connectés à Internet et les données pour fournir des services utiles et automatiser les processus.',
          },
        },
      ],
      service5Features: {
        attrs: {
          name: 'features',
          bulletColor: 'soft-primary',
          list: [
            {
              attrs: {
                title:
                  'Les clients peuvent choisir une entreprise offrant des produits de haute qualité.',
              },
            },
            {
              attrs: {
                title:
                  'Les clients peuvent choisir une entreprise offrant des produits de haute qualité.',
              },
            },
            {
              attrs: {
                title:
                  'Les clients peuvent choisir une entreprise offrant des produits de haute qualité.',
              },
            },
            {
              attrs: {
                title:
                  'Les clients peuvent choisir une entreprise offrant des produits de haute qualité.',
              },
            },
          ],
        },
      },
    },
  },
];
