import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const footer14Code = 'footer14';

export const footer14Schema = {
  title: 'Footer 14',
  code: footer14Code,
  type: Template.block,
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'json-many-to-one',
      widgetAttrs: {canNew: 'true', canEdit: 'true'},
      target: 'Image',
    },
    {
      name: 'title',
      title: 'Title',
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
      name: 'copyright',
      title: 'Copyright',
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
      name: 'listTitle',
      title: 'List Title',
      type: 'string',
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
      name: 'links',
      title: 'Links',
      type: 'json-one-to-many',
      target: 'Footer14Links',
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
      defaultValue: 'footer bg-dark section-frame mt-15',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pb-13 pb-md-15',
    },
  ],
  models: [
    socialLinksModel,
    {
      name: 'Footer14Links',
      title: 'Links',
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
    imageModel,
  ],
} as const satisfies TemplateSchema;

export type Footer14Data = Data<typeof footer14Schema>;

export const footer14Demos: Demo<typeof footer14Schema>[] = [
  {
    language: 'en_US',
    site: 'lighthouse-en',
    page: 'demo-22',
    sequence: 8,
    data: {
      footer14Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer14BackgroundImage: {
        attrs: {
          alt: 'Call to action background',
          width: 1153,
          height: 202,
          image: {
            fileName: 'bg27.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg27.jpg',
          },
        },
      },
      footer14Title:
        'Over 5K+ customers have put faith in us. Join them by utilize our offer to help your company develop.',
      footer14LinkTitle: 'Join Us',
      footer14LinkHref: '#',
      footer14Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer14AddressTitle: 'Get in Touch',
      footer14AddressLine:
        'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer14Email: 'info@email.com',
      footer14Phone: '00 (123) 456 78 90',
      footer14ListTitle: 'Learn More',
      footer14NewsletterTitle: 'Our Newsletter',
      footer14NewsletterDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer14Links: [
        {attrs: {title: 'About Us', url: '#'}},
        {attrs: {title: 'Our Story', url: '#'}},
        {attrs: {title: 'Projects', url: '#'}},
        {attrs: {title: 'Terms of Use', url: '#'}},
        {attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer14SocialLinks: [
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
    page: 'demo-22',
    sequence: 8,
    data: {
      footer14Logo: {
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer14BackgroundImage: {
        attrs: {
          alt: "Arrière-plan de l'appel à l'action",
          width: 1153,
          height: 202,
          image: {
            fileName: 'bg27.jpg',
            fileType: 'image/jpeg',
            filePath: '/img/photos/bg27.jpg',
          },
        },
      },
      footer14Title:
        'Plus de 5 000 clients nous ont fait confiance. Rejoignez-les en utilisant notre offre pour aider votre entreprise à se développer.',
      footer14LinkTitle: 'Rejoignez-nous',
      footer14LinkHref: '#',
      footer14Copyright: '© 2022 Lighthouse. Tous les droits sont réservés.',
      footer14AddressTitle: 'Contactez-nous',
      footer14AddressLine:
        'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer14Email: 'info@email.com',
      footer14Phone: '00 (123) 456 78 90',
      footer14ListTitle: 'En savoir plus',
      footer14NewsletterTitle: 'Notre bulletin',
      footer14NewsletterDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer14Links: [
        {attrs: {title: 'À propos de nous', url: '#'}},
        {attrs: {title: 'Notre histoire', url: '#'}},
        {attrs: {title: 'Projets', url: '#'}},
        {
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer14SocialLinks: [
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
