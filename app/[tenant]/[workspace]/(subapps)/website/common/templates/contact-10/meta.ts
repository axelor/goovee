import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {socialLinksModel} from '../json-models';

export const contact10Code = 'contact10';

export const contact10Schema = {
  title: 'Contact 10',
  code: contact10Code,
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
      name: 'copyright',
      title: 'Copyright',
      type: 'string',
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
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
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
      defaultValue: 'container py-14 py-md-16',
    },
  ],
  models: [socialLinksModel],
} as const satisfies TemplateSchema;

export type Contact10Data = Data<typeof contact10Schema>;

export const contact10Demos: Demo<typeof contact10Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-16',
    sequence: 4,
    data: {
      contact10Title: "Let's collaborate in case you love the things you see.",
      contact10Description:
        'I bring rapid solutions to make the life of my clients easier. Have any questions? Reach out to me from this contact form and I will get back to you shortly.',
      contact10Copyright: '© 2022 Lighthouse. All rights reserved.',
      contact10InputLabel1: 'Name *',
      contact10InputLabel2: 'Email *',
      contact10InputLabel3: 'Message *',
      contact10InvalidFeedback1: 'Please enter your name.',
      contact10ValidFeedback2: 'Looks good!',
      contact10InvalidFeedback2: 'Please provide a valid email address.',
      contact10ValidFeedback3: 'Looks good!',
      contact10InvalidFeedback3: 'Please enter your messsage.',
      contact10InputValue: 'Send message',
      contact10Placeholder1: 'Jane',
      contact10Placeholder2: 'jane.doe@example.com',
      contact10Placeholder3: 'Your message',
      contact10SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    site: 'lighthouse-fr',
    page: 'demo-16',
    sequence: 4,
    data: {
      contact10Title:
        'Collaborons au cas où vous aimez les choses que vous voyez.',
      contact10Description:
        'J’apporte des solutions rapides pour faciliter la vie de mes clients. Avez-vous des questions? Contactez-moi à partir de ce formulaire de contact et je vous répondrai sous peu.',
      contact10Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      contact10InputLabel1: 'Nom *',
      contact10InputLabel2: 'E-mail *',
      contact10InputLabel3: 'Message *',
      contact10InvalidFeedback1: 'S’il vous plaît entrez votre nom.',
      contact10ValidFeedback2: 'Ça a l’air bien !',
      contact10InvalidFeedback2: 'Veuillez fournir une adresse e-mail valide.',
      contact10ValidFeedback3: 'Ça a l’air bien !',
      contact10InvalidFeedback3: 'Veuillez saisir votre message.',
      contact10InputValue: 'Envoyer le message',
      contact10Placeholder1: 'Jane',
      contact10Placeholder2: 'jane.doe@example.com',
      contact10Placeholder3: 'Votre message',
      contact10SocialLinks: [
        {
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: 'https://www.youtube.com/channel/UCsIyD-TSO1wQFz-n2Y4i3Rg',
          },
        },
      ],
    },
  },
];
