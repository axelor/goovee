import {startCase} from 'lodash-es';
import {unicons} from '../../constants/unicons';
import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';

export const service10Schema = {
  title: 'Service 10',
  code: 'service10',
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
      name: 'image1',
      title: 'Image 1',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'image2',
      title: 'Image 2',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'cardTitle1',
      title: 'Card Title 1',
      type: 'string',
    },
    {
      name: 'cardTitle2',
      title: 'Card Title 2',
      type: 'string',
    },
    {
      name: 'cardIcon1',
      title: 'Card Icon 1',
      type: 'string',
      selection: unicons.map(icon => ({
        title: startCase(icon),
        value: icon,
      })),
    },
    {
      name: 'cardIcon2',
      title: 'Card Icon 2',
      type: 'string',
      selection: unicons.map(icon => ({
        title: startCase(icon),
        value: icon,
      })),
    },
    {
      name: 'cardDescription1',
      title: 'Card Description 1',
      type: 'string',
    },
    {
      name: 'cardDescription2',
      title: 'Card Description 2',
      type: 'string',
    },
    {
      name: 'cardUrl1',
      title: 'Card Url 1',
      type: 'string',
    },
    {
      name: 'cardUrl2',
      title: 'Card Url 2',
      type: 'string',
    },
    {
      name: 'cardButtonText1',
      title: 'Card Button Text 1',
      type: 'string',
    },
    {
      name: 'cardButtonText2',
      title: 'Card Button Text 2',
      type: 'string',
    },
  ],
  models: [],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Service10Data = Data<typeof service10Schema>;

export const service10Demos: Demo<typeof service10Schema>[] = [
  {
    language: 'en_US',
    data: {
      service10Title: 'What We Provide?',
      service10Description:
        'Agency services refer to a type of business model where companies or individuals outsource certain functions or tasks to an external agency. These agencies specialize in providing a range of services such as marketing, advertising, public relations, and creative services.',
      service10Caption:
        'The comprehensive service we provide is specially tailored to your company’s requirements.',
      service10LinkTitle: 'More Details',
      service10LinkHref: '#',
      service10Image1: {
        id: '1',
        version: 1,
        fileName: 'se1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se1.jpg',
      },
      service10Image2: {
        id: '1',
        version: 1,
        fileName: 'se2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se2.jpg',
      },
      service10CardTitle1: 'Artificial Intelligence',
      service10CardTitle2: 'IoT Development',
      service10CardIcon1: 'circuit',
      service10CardIcon2: 'desktop',
      service10CardDescription1:
        'IoT development, devices are connected to the internet and automate processes.',
      service10CardDescription2:
        'IoT development, devices are connected to the internet and automate processes.',
      service10CardUrl1: '#',
      service10CardUrl2: '#',
      service10CardButtonText1: 'Learn More',
      service10CardButtonText2: 'Learn More',
    },
  },
  {
    language: 'fr_FR',
    data: {
      service10Title: 'Ce que nous offrons ?',
      service10Description:
        'Les services d’agence font référence à un type de modèle commercial dans lequel les entreprises ou les particuliers sous-traitent certaines fonctions ou tâches à une agence externe. Ces agences se spécialisent dans la fourniture d’une gamme de services tels que le marketing, la publicité, les relations publiques et les services créatifs.',
      service10Caption:
        'Le service complet que nous fournissons est spécialement adapté aux besoins de votre entreprise.',
      service10LinkTitle: 'Plus de détails',
      service10LinkHref: '#',
      service10Image1: {
        id: '1',
        version: 1,
        fileName: 'se1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se1.jpg',
      },
      service10Image2: {
        id: '1',
        version: 1,
        fileName: 'se2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/se2.jpg',
      },
      service10CardTitle1: 'Intelligence artificielle',
      service10CardTitle2: 'Développement IoT',
      service10CardIcon1: 'circuit',
      service10CardIcon2: 'desktop',
      service10CardDescription1:
        'Développement IoT, les appareils sont connectés à Internet et automatisent les processus.',
      service10CardDescription2:
        'Développement IoT, les appareils sont connectés à Internet et automatisent les processus.',
      service10CardUrl1: '#',
      service10CardUrl2: '#',
      service10CardButtonText1: 'En savoir plus',
      service10CardButtonText2: 'En savoir plus',
    },
  },
];
