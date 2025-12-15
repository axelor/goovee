import type {SortOption} from '../types';

export const colors = {
  default: 'bg-secondary',
  red: 'bg-red-500/30 text-red-500',
  pink: 'bg-pink-500/30 text-pink-500',
  purple: 'bg-purple-500/30 text-purple-500',
  deeppurple: 'bg-purple-900/30 text-purple-900',
  indigo: 'bg-indigo-500/30 text-indigo-500',
  blue: 'bg-blue-500/30 text-blue-500',
  lightblue: 'bg-sky-500/30 text-sky-500',
  cyan: 'bg-cyan-500/30 text-cyan-500',
  teal: 'bg-teal-500/30 text-teal-500',
  green: 'bg-green-500/30 text-green-500',
  lightgreen: 'bg-green-200/30 text-green-200',
  lime: 'bg-lime-500/30 text-lime-500',
  yellow: 'bg-yellow-500/30 text-yellow-500',
  amber: 'bg-amber-500/30 text-amber-500',
  orange: 'bg-orange-500/30 text-orange-500',
  deeporange: 'bg-orange-900/30 text-orange-900',
  brown: 'bg-amber-700/30 text-amber-700', // Closest to brown
  grey: 'bg-gray-500/30 text-gray-500',
  bluegrey: 'bg-slate-500/30 text-slate-500',
  black: 'bg-black/20 text-black',
  white: 'bg-black/80 text-white',
};

export const sortOptions: SortOption[] = [
  {value: 'a-z', label: 'A-Z', orderBy: {simpleFullName: 'ASC'}},
  {value: 'z-a', label: 'Z-A', orderBy: {simpleFullName: 'DESC'}},
];

export const defaultSortOption = sortOptions[0];

export enum MAP_SELECT {
  GoogleMaps = 1,
  OpenStreetMap = 2,
}

export const civility = [
  {title: 'M.', value: 1},
  {title: 'Ms.', value: 2},
  {title: 'Mx.', value: 3},
];
