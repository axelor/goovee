import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';
import {solidIconsSelection} from '../meta-selections';

export const process5Schema = {
  title: 'Process 5',
  code: 'process5',
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
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'processes',
      title: 'Processes',
      type: 'json-one-to-many',
      target: 'Process5Processes',
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
      defaultValue: 'container pb-14 pb-md-17 mb-lg-19 mb-xl-22',
    },
  ],
  models: [
    {
      name: 'Process5Processes',
      title: 'Processes',
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
      ],
    },
    imageModel,
  ],
  selections: [solidIconsSelection],
} as const satisfies TemplateSchema;

export type Process5Data = Data<typeof process5Schema>;

export const process5Demos: Demo<typeof process5Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-6',
    sequence: 3,
    data: {
      process5Title:
        "Download the app, create your profile, and you're ready to go!",
      process5Caption: 'How It Works',
      process5Description:
        'Individual health-related objectives may vary depending on factors such as age, gender, medical history, and personal preferences. Additionally, it’s important to set realistic and achievable goals that are specific, measurable, and time-bound.',
      process5Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'how it work',
          width: 747,
          height: 786,
          image: {
            id: '1',
            version: 1,
            fileName: 'device.png',
            fileType: 'image/png',
            filePath: '/img/photos/device.png',
          },
        },
      },
      process5Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Download',
            title: '1. Download',
            description: 'The speed & success of a download.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'ClipboardList',
            title: '2. Set Profile',
            description: 'The speed & success of a download.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'HourGlassStart',
            title: '3. Start',
            description: 'The speed & success of a download.',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'fr',
    page: 'demo-6',
    sequence: 3,
    data: {
      process5Title:
        'Téléchargez l’application, créez votre profil et vous êtes prêt à partir !',
      process5Caption: 'Comment ça marche',
      process5Description:
        'Les objectifs individuels liés à la santé peuvent varier en fonction de facteurs tels que l’âge, le sexe, les antécédents médicaux et les préférences personnelles. De plus, il est important de se fixer des objectifs réalistes et réalisables, spécifiques, mesurables et limités dans le temps.',
      process5Image: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'comment ça marche',
          width: 747,
          height: 786,
          image: {
            id: '1',
            version: 1,
            fileName: 'device.png',
            fileType: 'image/png',
            filePath: '/img/photos/device.png',
          },
        },
      },
      process5Processes: [
        {
          id: '1',
          version: 0,
          attrs: {
            icon: 'Download',
            title: '1. Télécharger',
            description: 'La vitesse et le succès d’un téléchargement.',
          },
        },
        {
          id: '2',
          version: 0,
          attrs: {
            icon: 'ClipboardList',
            title: '2. Définir le profil',
            description: 'La vitesse et le succès d’un téléchargement.',
          },
        },
        {
          id: '3',
          version: 0,
          attrs: {
            icon: 'HourGlassStart',
            title: '3. Démarrer',
            description: 'La vitesse et le succès d’un téléchargement.',
          },
        },
      ],
    },
  },
];
