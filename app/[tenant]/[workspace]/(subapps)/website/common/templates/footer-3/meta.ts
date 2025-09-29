import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {metaFileModel} from '../meta-models';
import {socialLinksModel} from '../json-models';

export const footer3Schema = {
  title: 'Footer 3',
  code: 'footer3',
  type: Template.block,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'newsletterTitle',
      title: 'Newsletter Title',
      type: 'string',
    },
    {
      name: 'newsletterDescription',
      title: 'Newsletter Description',
      type: 'string',
    },
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
      name: 'addressTitle',
      title: 'Address Title',
      type: 'string',
    },
    {
      name: 'addressLine',
      title: 'Address Line',
      type: 'string',
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
    },
    {
      name: 'copyright',
      title: 'Copyright',
      type: 'string',
    },
    {
      name: 'listTitle1',
      title: 'List Title 1',
      type: 'string',
    },
    {
      name: 'listTitle2',
      title: 'List Title 2',
      type: 'string',
    },
    {
      name: 'helps',
      title: 'Helps',
      type: 'json-one-to-many',
      target: 'Footer3Helps',
    },
    {
      name: 'learnMore',
      title: 'Learn More',
      type: 'json-one-to-many',
      target: 'Footer3LearnMore',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
    },
    {
      name: 'footerClassName',
      title: 'Footer Class Name',
      type: 'string',
      defaultValue: 'footer bg-gradient-reverse-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-13 pt-md-15 pb-7',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer3Helps',
      title: 'Helps',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
        },
      ],
    },
    {
      name: 'Footer3LearnMore',
      title: 'Learn More',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
        },
      ],
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer3Data = Data<typeof footer3Schema>;

export const footer3Demos: Demo<typeof footer3Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-7',
    sequence: 8,
    data: {
      footer3Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      footer3NewsletterTitle: 'Subscribe to our newsletter',
      footer3NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you. Dont worry, we hate spam and we respect your privacy.',
      footer3Title: 'Join the Community',
      footer3Description:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      footer3LinkTitle: 'Join Us',
      footer3LinkHref: '#',
      footer3AddressTitle: 'Get in Touch',
      footer3AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer3Email: 'info@email.com',
      footer3Phone: '00 (123) 456 78 90',
      footer3Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer3ListTitle1: 'Need Help?',
      footer3ListTitle2: 'Learn More',
      footer3Helps: [
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Get Started', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer3LearnMore: [
        {id: '1', version: 0, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Pricing', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Features', url: '#'}},
      ],
      footer3SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
    page: 'demo-7',
    sequence: 8,
    data: {
      footer3Image: {
        id: '1',
        version: 1,
        fileName: 'bg2.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/bg2.jpg',
      },
      footer3NewsletterTitle: 'Abonnez-vous à notre newsletter',
      footer3NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres. Ne vous inquiétez pas, nous détestons le spam et nous respectons votre vie privée.',
      footer3Title: 'Rejoignez la communauté',
      footer3Description:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      footer3LinkTitle: 'Rejoignez-nous',
      footer3LinkHref: '#',
      footer3AddressTitle: 'Contactez-nous',
      footer3AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer3Email: 'info@email.com',
      footer3Phone: '00 (123) 456 78 90',
      footer3Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer3ListTitle1: 'Besoin d’aide ?',
      footer3ListTitle2: 'En savoir plus',
      footer3Helps: [
        {id: '1', version: 0, attrs: {title: 'Support', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Commencer', url: '#'}},
        {
          id: '3',
          version: 0,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '4',
          version: 0,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer3LearnMore: [
        {id: '1', version: 0, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 0, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 0, attrs: {title: 'Projets', url: '#'}},
        {id: '4', version: 0, attrs: {title: 'Tarifs', url: '#'}},
        {id: '5', version: 0, attrs: {title: 'Caractéristiques', url: '#'}},
      ],
      footer3SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: 'https://twitter.com/uilibofficial',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: 'https://facebook.com/uiLibOfficial/',
          },
        },
        {
          id: '3',
          version: 1,
          attrs: {
            name: 'Dribbble',
            icon: 'dribbble',
            url: '#',
          },
        },
        {
          id: '4',
          version: 1,
          attrs: {
            name: 'Instagram',
            icon: 'instagram',
            url: 'https://www.instagram.com/uilibofficial/',
          },
        },
        {
          id: '5',
          version: 1,
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
