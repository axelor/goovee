import {Data, Meta} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';
import {socialMediaUnicons} from '../../constants/unicons';
import {startCase} from 'lodash-es';

export const footer1Meta = {
  title: 'Footer 1',
  code: 'footer1',
  type: 1,
  fields: [
    {
      name: 'logo',
      title: 'Logo',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
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
      target: 'Footer1SocialLinks',
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
  ],
  models: [
    {
      name: 'Footer1SocialLinks',
      title: 'Footer 1 Social Links',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'icon',
          title: 'Icon',
          type: 'string',
          selection: socialMediaUnicons.map(icon => ({
            title: startCase(icon),
            value: icon,
          })),
          visibleInGrid: true,
          required: true,
        },
        {
          name: 'url',
          title: 'Url',
          type: 'string',
          required: true,
        },
      ],
    },
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
  metaModels: [metaFileModel],
} as const satisfies Meta;

export type Footer1Data = Data<typeof footer1Meta>;

export const footer1Demo: Footer1Data = {
  footer1Title:
    'Join our community by using our services and grow your business.',
  footer1ButtonLink: '#',
  footer1ButtonText: 'Try It For Free',
  footer1CopyrightText:
    '© 2022 Lighthouse. <br className="d-none d-lg-block" /> All rights reserved.',
  footer1Logo: {
    id: '5',
    version: 1,
    fileName: 'logo-light.png',
    filePath: '/img/logo-light.png',
    fileType: 'image/png',
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
};
