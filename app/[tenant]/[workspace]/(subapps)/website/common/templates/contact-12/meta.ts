import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel} from '../json-models';

export const contact12Code = 'contact12';

export const contact12Schema = {
  title: 'Contact 12',
  code: contact12Code,
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
      name: 'image',
      title: 'Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'inputLabel1',
      title: 'Input Label 1',
      type: 'string',
    },
    {
      name: 'inputLabel2',
      title: 'Input Label 2',
      type: 'string',
    },
    {
      name: 'inputLabel3',
      title: 'Input Label 3',
      type: 'string',
    },
    {
      name: 'invalidFeedback1',
      title: 'Invalid Feedback 1',
      type: 'string',
    },
    {
      name: 'validFeedback1',
      title: 'Valid Feedback 1',
      type: 'string',
    },
    {
      name: 'validFeedback2',
      title: 'Valid Feedback 2',
      type: 'string',
    },
    {
      name: 'invalidFeedback2',
      title: 'Invalid Feedback 2',
      type: 'string',
    },
    {
      name: 'validFeedback3',
      title: 'Valid Feedback 3',
      type: 'string',
    },
    {
      name: 'invalidFeedback3',
      title: 'Invalid Feedback 3',
      type: 'string',
    },
    {
      name: 'inputValue',
      title: 'Input Value',
      type: 'string',
    },
    {
      name: 'placeholder1',
      title: 'Placeholder 1',
      type: 'string',
    },
    {
      name: 'placeholder2',
      title: 'Placeholder 2',
      type: 'string',
    },
    {
      name: 'placeholder3',
      title: 'Placeholder 3',
      type: 'string',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper image-wrapper bg-image bg-overlay',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-15 py-md-17',
    },
  ],
  models: [imageModel],
} as const satisfies TemplateSchema;

export type Contact12Data = Data<typeof contact12Schema>;

export const contact12Demos: Demo<typeof contact12Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-24',
    sequence: 7,
    data: {
      contact12Title: 'Request Photography Pricing',
      contact12Description:
        'For more information please get in touch using the form below:',
      contact12Image: {
        attrs: {
          alt: 'Photography pricing request form background',
          width: 1440,
          height: 816,
          image: {
            fileName: 'bg36.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg36.jpg',
          },
        },
      },
      contact12InputLabel1: 'Name *',
      contact12InputLabel2: 'Email *',
      contact12InputLabel3: 'Message *',
      contact12InvalidFeedback1: 'Please enter your name.',
      contact12ValidFeedback1: 'Looks good!',
      contact12ValidFeedback2: 'Looks good!',
      contact12InvalidFeedback2: 'Please provide a valid email address.',
      contact12ValidFeedback3: 'Looks good!',
      contact12InvalidFeedback3: 'Please enter your messsage.',
      contact12InputValue: 'Send message',
      contact12Placeholder1: 'Name',
      contact12Placeholder2: 'jane.doe@example.com',
      contact12Placeholder3: 'Your message',
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-24',
    sequence: 7,
    data: {
      contact12Title: 'Demander un devis de photographie',
      contact12Description:
        'Pour plus d’informations, veuillez nous contacter en utilisant le formulaire ci-dessous :',
      contact12Image: {
        attrs: {
          alt: 'Arrière-plan du formulaire de demande de prix de photographie',
          width: 1440,
          height: 816,
          image: {
            fileName: 'bg36.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg36.jpg',
          },
        },
      },
      contact12InputLabel1: 'Nom *',
      contact12InputLabel2: 'E-mail *',
      contact12InputLabel3: 'Message *',
      contact12InvalidFeedback1: 'S’il vous plaît entrez votre nom.',
      contact12ValidFeedback1: 'Ça a l’air bien !',
      contact12ValidFeedback2: 'Ça a l’air bien !',
      contact12InvalidFeedback2: 'Veuillez fournir une adresse e-mail valide.',
      contact12ValidFeedback3: 'Ça a l’air bien !',
      contact12InvalidFeedback3: 'Veuillez saisir votre message.',
      contact12InputValue: 'Envoyer le message',
      contact12Placeholder1: 'Nom',
      contact12Placeholder2: 'jane.doe@example.com',
      contact12Placeholder3: 'Votre message',
    },
  },
];
