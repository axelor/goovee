import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';
import {socialLinksModel} from '../json-models';
import {metaFileModel} from '../meta-models';

export const footer2Schema = {
  title: 'Footer 2',
  code: 'footer2',
  type: Template.block,
  fields: [
    {
      name: 'contactTitle',
      title: 'Contact Title',
      type: 'string',
    },
    {
      name: 'contactDescription1',
      title: 'Contact Description 1',
      type: 'string',
    },
    {
      name: 'contactDescription2',
      title: 'Contact Description 2',
      type: 'string',
    },
    {
      name: 'contactLinkTitle',
      title: 'Contact Link Title',
      type: 'string',
    },
    {
      name: 'contactLinkHref',
      title: 'Contact Link Href',
      type: 'string',
    },
    {
      name: 'contactImage',
      title: 'Contact Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'addressTitle',
      title: 'Address Title',
      type: 'string',
    },
    {
      name: 'addressLine1',
      title: 'Address Line 1',
      type: 'string',
    },
    {
      name: 'addressLine2',
      title: 'Address Line 2',
      type: 'string',
    },
    {
      name: 'phoneTitle',
      title: 'Phone Title',
      type: 'string',
    },
    {
      name: 'phone1',
      title: 'Phone 1',
      type: 'string',
    },
    {
      name: 'phone2',
      title: 'Phone 2',
      type: 'string',
    },
    {
      name: 'emailTitle',
      title: 'Email Title',
      type: 'string',
    },
    {
      name: 'email1',
      title: 'Email 1',
      type: 'string',
    },
    {
      name: 'email2',
      title: 'Email 2',
      type: 'string',
    },
    {
      name: 'copyright',
      title: 'Copyright',
      type: 'string',
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
      defaultValue: 'bg-soft-primary mt-n20 pt-21 pt-md-22',
    },
    {
      name: 'sectionClassName',
      title: 'Section Class Name',
      type: 'string',
      defaultValue: 'position-relative',
    },
  ],
  models: [socialLinksModel],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Footer2Data = Data<typeof footer2Schema>;

export const footer2Demos: Demo<typeof footer2Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-4',
    sequence: 11,
    data: {
      footer2ContactTitle: 'Let’s Talk',
      footer2ContactDescription1:
        'Lets make something great together. We are trusted by over 5000+ clients. Join them by using our services and grow your business.',
      footer2ContactDescription2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      footer2ContactLinkTitle: 'Join Us',
      footer2ContactLinkHref: '#',
      footer2ContactImage: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
      },
      footer2AddressTitle: 'Address',
      footer2AddressLine1: 'Moonshine St. 14/05',
      footer2AddressLine2: 'Light City, London, UK',
      footer2PhoneTitle: 'Phone',
      footer2Phone1: '00 (123) 456 78 90',
      footer2Phone2: '00 (987) 654 32 10',
      footer2EmailTitle: 'E-mail',
      footer2Email1: 'user@email.com',
      footer2Email2: 'help@user.com',
      footer2Copyright: '© 2022 Lighthouse. All rights reserved.',
      footer2SocialLinks: [
        {
          id: '1',
          version: 1,
          attrs: {
            name: 'Twitter',
            icon: 'twitter',
            url: '#',
          },
        },
        {
          id: '2',
          version: 1,
          attrs: {
            name: 'Facebook',
            icon: 'facebook-f',
            url: '#',
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
            url: '#',
          },
        },
        {
          id: '5',
          version: 1,
          attrs: {
            name: 'Youtube',
            icon: 'youtube',
            url: '#',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-4',
    sequence: 11,
    data: {
      footer2ContactTitle: 'Parlons',
      footer2ContactDescription1:
        'Faisons quelque chose de grand ensemble. Plus de 5000 clients nous font confiance. Rejoignez-les en utilisant nos services et développez votre entreprise.',
      footer2ContactDescription2:
        'Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Maecenas faucibus mollis interdum. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.',
      footer2ContactLinkTitle: 'Rejoignez-nous',
      footer2ContactLinkHref: '#',
      footer2ContactImage: {
        id: '1',
        version: 1,
        fileName: 'tm1.jpg',
        fileType: 'image/jpeg',
        filePath: '/img/photos/tm1.jpg',
      },
      footer2AddressTitle: 'Adresse',
      footer2AddressLine1: 'Moonshine St. 14/05',
      footer2AddressLine2: 'Light City, Londres, Royaume-Uni',
      footer2PhoneTitle: 'Téléphone',
      footer2Phone1: '00 (123) 456 78 90',
      footer2Phone2: '00 (987) 654 32 10',
      footer2EmailTitle: 'E-mail',
      footer2Email1: 'user@email.com',
      footer2Email2: 'help@user.com',
      footer2Copyright: '© 2022 Lighthouse. Tous droits réservés.',
      footer2SocialLinks: [
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
