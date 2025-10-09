import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {serviceList3Model} from '../json-models';

export const about25Schema = {
  title: 'About 25',
  code: 'about25',
  type: Template.block,
  fields: [
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
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
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
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
      defaultValue: 'wrapper bg-gray',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [serviceList3Model],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type About25Data = Data<typeof about25Schema>;

export const about25Demos: Demo<typeof about25Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-24',
    sequence: 6,
    data: {
      about25Image: {
        id: '1',
        version: 1,
        fileName: 'about30.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about30.jpg',
      },
      about25Caption: 'About Me',
      about25Para1:
        'My name is Caitlyn, and I specialize in capturing food, beverages, and photography of products.',
      about25Para2:
        'Menu selection is a crucial aspect of restaurant services, as it determine the types of dishes and drinks that will be available to customers. Food preparation also plays a critical role, as the quality and taste of the dishes will ultimately determine customer satisfaction. Table service involves how the restaurant staff interacts with customers.',
      about25Description:
        'Restaurant services refer to the various elements that make up the dining experience at a restaurant. Include menu selection, food preparation, table service. Restaurant services refer to the various elements that make up the dining experience.',
      about25LinkTitle: 'Learn More',
      about25LinkHref: '#',
      about25Heading: 'My Working Process',
      about25AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Concept',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Prepare',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Retouch',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Finalize',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-24',
    sequence: 6,
    data: {
      about25Image: {
        id: '1',
        version: 1,
        fileName: 'about30.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/about30.jpg',
      },
      about25Caption: 'À propos de moi',
      about25Para1:
        'Je m’appelle Caitlyn et je me spécialise dans la capture de plats, de boissons et de photographies de produits.',
      about25Para2:
        'La sélection du menu est un aspect crucial des services de restauration, car elle détermine les types de plats et de boissons qui seront proposés aux clients. La préparation des aliments joue également un rôle essentiel, car la qualité et le goût des plats détermineront en fin de compte la satisfaction du client. Le service à table concerne la manière dont le personnel du restaurant interagit avec les clients.',
      about25Description:
        'Les services de restauration font référence aux différents éléments qui composent l’expérience culinaire dans un restaurant. Inclure la sélection du menu, la préparation des plats, le service à table. Les services de restauration font référence aux différents éléments qui composent l’expérience culinaire.',
      about25LinkTitle: 'En savoir plus',
      about25LinkHref: '#',
      about25Heading: 'Mon processus de travail',
      about25AboutList: [
        {
          id: '1',
          version: 0,
          attrs: {
            title: 'Concept',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            title: 'Préparer',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            title: 'Retoucher',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
        {
          id: '4',
          version: 0,
          attrs: {
            title: 'Finaliser',
            description:
              'Nulla vitae elit libero, a pharetra augue. Donec id elit non mi porta gravida.',
          },
        },
      ],
    },
  },
];
