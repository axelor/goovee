import type {MetaSelection} from '../types/templates';
import {
  socialMediaUnicons,
  unicons,
} from '@/subapps/website/common/constants/unicons';
import {solidIcons} from '@/subapps/website/common/icons/solid';
import {
  colors,
  linkColors,
  fullColors,
} from '@/subapps/website/common/constants/colors';
import {startCase} from 'lodash-es';
import {linealIcons} from '../icons/lineal';

export const buttonColorSelection = {
  name: 'button-colors',
  options: [
    {
      title: 'White',
      value: 'white',
    },
    {
      title: 'Primary',
      value: 'primary',
    },
  ],
} as const satisfies MetaSelection;

export const uniconsSelection = {
  name: 'unicons',
  options: unicons.map(icon => ({
    title: startCase(icon),
    value: icon,
  })),
} as const satisfies MetaSelection;

export const socialMediaUniconsSelection = {
  name: 'social-media-unicons',
  options: socialMediaUnicons.map(icon => ({
    title: startCase(icon),
    value: icon,
  })),
} as const satisfies MetaSelection;

export const solidIconsSelection = {
  name: 'solid-icons',
  options: solidIcons.map(icon => ({
    title: startCase(icon),
    value: icon,
  })),
} as const satisfies MetaSelection;

export const linealIconsSelection = {
  name: 'lineal-icons',
  options: linealIcons.map(icon => ({
    title: startCase(icon),
    value: icon,
  })),
} as const satisfies MetaSelection;

export const colorsSelection = {
  name: 'colors',
  options: colors.map(color => ({
    title: startCase(color),
    value: color,
  })),
} as const satisfies MetaSelection;

export const linkColorsSelection = {
  name: 'link-colors',
  options: linkColors.map(color => ({
    title: startCase(color),
    value: color,
  })),
} as const satisfies MetaSelection;

export const fullColorsSelection = {
  name: 'full-colors',
  options: fullColors.map(color => ({
    title: startCase(color),
    value: color,
  })),
} as const satisfies MetaSelection;

export const ratingsSelection = {
  name: 'ratings',
  options: [
    {title: 'One', value: 1},
    {title: 'Two', value: 2},
    {title: 'Three', value: 3},
    {title: 'Four', value: 4},
    {title: 'Five', value: 5},
  ],
} as const satisfies MetaSelection;
