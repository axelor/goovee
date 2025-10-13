import {
  Data,
  Demo,
  Template,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {imageModel, socialLinksModel} from '../json-models';

export const footer1Code = 'footer1';

export const footer1Schema = {
  title: 'Footer 1',
  code: footer1Code,
  type: Template.block,
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'json-many-to-one',
      target: 'Image',
    },
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'buttonLink',
      title: 'Button Link',
      type: 'string',
    },
    {
      name: 'buttonText',
      title: 'Button Text',
      type: 'string',
    },
    {
      name: 'copyrightText',
      title: 'Copyright Text',
      type: 'string',
      widget: 'Html',
    },
    {
      name: 'addressTitle',
      title: 'Address Title',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'string',
    },
    {
      name: 'socialLinks',
      title: 'Social Links',
      type: 'json-one-to-many',
      target: 'SocialLinks',
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
      name: 'navTitle',
      title: 'Nav Title',
      type: 'string',
    },
    {
      name: 'navLinks',
      title: 'Nav Links',
      type: 'json-one-to-many',
      target: 'Footer1NavLinks',
    },
    {
      name: 'formTitle',
      title: 'Form Title',
      type: 'string',
    },
    {
      name: 'formDescription',
      title: 'Form Description',
      type: 'string',
    },
    {
      name: 'footerClassName',
      title: 'Footer Class Name',
      type: 'string',
      defaultValue: 'footer bg-navy text-inverse',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container pt-15 pt-md-17 pb-13 pb-md-15',
    },
  ],
  models: [
    socialLinksModel,
    imageModel,
    {
      name: 'Footer1NavLinks',
      title: 'Footer 1 NavLinks',
      fields: [
        {
          name: 'title',
          title: 'Title',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
          required: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
          visibleInGrid: true,
          required: true,
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Footer1Data = Data<typeof footer1Schema>;

export const footer1Demos: Demo<typeof footer1Schema>[] = [
  {
    language: 'en_US',
    site: 'en',
    page: 'demo-14',
    sequence: 9,
    data: {
      footer1Title:
        'Join our community by using our services and grow your business.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Try It For Free',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> All rights reserved.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Get in Touch',
      footer1Address: 'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'Learn More',
      footer1FormTitle: 'Our Newsletter',
      footer1FormDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 1, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 1, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer1SocialLinks: [
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
    site: 'fr',
    page: 'demo-14',
    sequence: 9,
    data: {
      footer1Title:
        'Rejoignez notre communauté en utilisant nos services et développez votre entreprise.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Essayez-le gratuitement',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> Tous droits réservés.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Contactez-nous',
      footer1Address: 'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'En savoir plus',
      footer1FormTitle: 'Notre bulletin',
      footer1FormDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projets', url: '#'}},
        {
          id: '4',
          version: 1,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '5',
          version: 1,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer1SocialLinks: [
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
    language: 'en_US',
    site: 'en',
    page: 'demo-1',
    sequence: 12,
    data: {
      footer1Title:
        'Join our community by using our services and grow your business.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Try It For Free',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> All rights reserved.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Get in Touch',
      footer1Address: 'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'Learn More',
      footer1FormTitle: 'Our Newsletter',
      footer1FormDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 1, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 1, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer1SocialLinks: [
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
    site: 'fr',
    page: 'demo-1',
    sequence: 12,
    data: {
      footer1Title:
        'Rejoignez notre communauté en utilisant nos services et développez votre entreprise.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Essayez-le gratuitement',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> Tous droits réservés.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Contactez-nous',
      footer1Address: 'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'En savoir plus',
      footer1FormTitle: 'Notre bulletin',
      footer1FormDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projets', url: '#'}},
        {
          id: '4',
          version: 1,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '5',
          version: 1,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer1SocialLinks: [
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
    language: 'en_US',
    site: 'en',
    page: 'demo-11',
    sequence: 12,
    data: {
      footer1Title:
        'Join our community by using our services and grow your business.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Try It For Free',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> All rights reserved.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Get in Touch',
      footer1Address: 'Moonshine St. 14/05 Light City, London, United Kingdom',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'Learn More',
      footer1FormTitle: 'Our Newsletter',
      footer1FormDescription:
        'Subscribe to our newsletter to get our news & deals delivered to you.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'About Us', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Our Story', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projects', url: '#'}},
        {id: '4', version: 1, attrs: {title: 'Terms of Use', url: '#'}},
        {id: '5', version: 1, attrs: {title: 'Privacy Policy', url: '#'}},
      ],
      footer1SocialLinks: [
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
    site: 'fr',
    page: 'demo-11',
    sequence: 12,
    data: {
      footer1Title:
        'Rejoignez notre communauté en utilisant nos services et développez votre entreprise.',
      footer1ButtonLink: '#',
      footer1ButtonText: 'Essayez-le gratuitement',
      footer1CopyrightText:
        '© 2022 Lighthouse. <br className="d-none d-lg-block" /> Tous droits réservés.',
      footer1Logo: {
        id: '1',
        version: 0,
        attrs: {
          alt: 'logo',
          width: 146,
          height: 38,
          image: {
            id: '1',
            version: 1,
            fileName: 'logo-light.png',
            fileType: 'image/png',
            filePath: '/img/logo-light.png',
          },
        },
      },
      footer1AddressTitle: 'Contactez-nous',
      footer1Address: 'Moonshine St. 14/05 Light City, Londres, Royaume-Uni',
      footer1Email: 'info@email.com',
      footer1Phone: '00 (123) 456 78 90',
      footer1NavTitle: 'En savoir plus',
      footer1FormTitle: 'Notre bulletin',
      footer1FormDescription:
        'Abonnez-vous à notre newsletter pour recevoir nos actualités et nos offres.',
      footer1NavLinks: [
        {id: '1', version: 1, attrs: {title: 'À propos de nous', url: '#'}},
        {id: '2', version: 1, attrs: {title: 'Notre histoire', url: '#'}},
        {id: '3', version: 1, attrs: {title: 'Projets', url: '#'}},
        {
          id: '4',
          version: 1,
          attrs: {title: "Conditions d'utilisation", url: '#'},
        },
        {
          id: '5',
          version: 1,
          attrs: {title: 'Politique de confidentialité', url: '#'},
        },
      ],
      footer1SocialLinks: [
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
