import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {solidIconsSelection} from '../meta-selections';

export const service22Code = 'service22';

export const service22Schema = {
  title: 'Service 22',
  code: service22Code,
  type: Template.block,
  fields: [
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'tabs',
      title: 'Tabs',
      type: 'json-one-to-many',
      target: 'Service22Tab',
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
      defaultValue: 'container pb-15 pb-md-17',
    },
  ],
  models: [
    {
      name: 'Service22Tab',
      title: 'Tab',
      fields: [
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: 'solid-icons',
        },
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
          name: 'listTitle',
          title: 'List Title',
          type: 'string',
        },
        {
          name: 'listDescription',
          title: 'List Description',
          type: 'string',
        },
        {
          name: 'list',
          title: 'List',
          type: 'json-one-to-many',
          target: 'Service22ListItem',
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
          name: 'image',
          title: 'Image',
          type: 'json-many-to-one',
          widgetAttrs: {canNew: 'true', canEdit: 'true'},
          target: 'Image',
        },
      ],
    },
    {
      name: 'Service22ListItem',
      title: 'List Item',
      fields: [
        {
          name: 'item',
          title: 'Item',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
      ],
    },
    imageModel,
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Service22Data = Data<typeof service22Schema>;

export const service22Demos: Demo<typeof service22Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-19',
    sequence: 3,
    data: {
      service22Caption: 'Why Choose us?',
      service22Title:
        'Here are a small number of the reasons why our customers use Lighthouse.',
      service22Tabs: [
        {
          attrs: {
            icon: 'CheckShield',
            title: 'Easy Usage',
            description:
              'Customers may choose company offer high-quality product.',
            listTitle: 'Easy Usage',
            listDescription:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
            list: [
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
            ],
            linkTitle: 'Learn More',

            linkHref: '#',
            image: {
              attrs: {
                alt: 'Tab image',
                width: 567,
                height: 381,
                image: {
                  fileName: 'se5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            icon: 'Dollar',
            title: 'Fast Transactions',
            description:
              'Customers may choose company offer high-quality product.',
            listTitle: 'Fast Transactions',
            listDescription:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
            list: [
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            image: {
              attrs: {
                alt: 'Tab image',
                width: 610,
                height: 410,
                image: {
                  fileName: 'se6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se6.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            icon: 'Update',
            title: 'Secure Payments',
            description:
              'Customers may choose company offer high-quality product.',
            listTitle: 'Secure Payments',
            listDescription:
              'Customers may choose your company because you provide excellent customer service that makes them feel valued and appreciated. This can include fast response times, personalized attention. Customers may choose your company because you provide excellent customer service.',
            list: [
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
              {
                attrs: {
                  item: 'Customers may choose company offer high-quality product.',
                },
              },
            ],
            linkTitle: 'Learn More',
            linkHref: '#',
            image: {
              attrs: {
                alt: 'Tab image',
                width: 610,
                height: 410,
                image: {
                  fileName: 'se7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se7.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-19',
    sequence: 3,
    data: {
      service22Caption: 'Pourquoi nous choisir ?',
      service22Title:
        'Voici quelques-unes des raisons pour lesquelles nos clients utilisent Lighthouse.',
      service22Tabs: [
        {
          attrs: {
            icon: 'CheckShield',
            title: 'Utilisation facile',
            description:
              'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
            listTitle: 'Utilisation facile',
            listDescription:
              'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui leur donne le sentiment d’être valorisés et appréciés. Cela peut inclure des délais de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
            list: [
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              attrs: {
                alt: "Image de l'onglet",
                width: 567,
                height: 381,
                image: {
                  fileName: 'se5.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se5.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            icon: 'Dollar',
            title: 'Transactions rapides',
            description:
              'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
            listTitle: 'Transactions rapides',
            listDescription:
              'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui leur donne le sentiment d’être valorisés et appréciés. Cela peut inclure des délais de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
            list: [
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              attrs: {
                alt: "Image de l'onglet",
                width: 610,
                height: 410,
                image: {
                  fileName: 'se6.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se6.jpg',
                },
              },
            },
          },
        },
        {
          attrs: {
            icon: 'Update',
            title: 'Paiements sécurisés',
            description:
              'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
            listTitle: 'Paiements sécurisés',
            listDescription:
              'Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client qui leur donne le sentiment d’être valorisés et appréciés. Cela peut inclure des délais de réponse rapides, une attention personnalisée. Les clients peuvent choisir votre entreprise parce que vous offrez un excellent service client.',
            list: [
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
              {
                attrs: {
                  item: 'Les clients peuvent choisir une entreprise proposant des produits de haute qualité.',
                },
              },
            ],
            linkTitle: 'En savoir plus',
            linkHref: '#',
            image: {
              attrs: {
                alt: "Image de l'onglet",
                width: 610,
                height: 410,
                image: {
                  fileName: 'se7.jpg',
                  fileType: 'image/jpeg',
                  filePath: '/img/photos/se7.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
];
