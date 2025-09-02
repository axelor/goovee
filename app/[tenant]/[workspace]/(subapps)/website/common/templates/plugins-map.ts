import {formatComponentCode} from '../utils/templates';
import {about10Schema} from './about-10/meta';
import {about13Schema} from './about-13/meta';
import {about18Schema} from './about-18/meta';
import {about2Schema} from './about-2/meta';
import {about5Schema} from './about-5/meta';
import {about21Schema} from './about-21/meta';
import {about24Schema} from './about-24/meta';
import {facts13Schema} from './facts-13/meta';
import {facts16Schema} from './facts-16/meta';
import {hero3Schema} from './hero-3/meta';

const pluginsMap = {
  [about2Schema.code]: ['lightbox'],
  [about5Schema.code]: ['progress-bar'],
  [about10Schema.code]: ['progress-bar', 'lightbox'],
  [about13Schema.code]: ['lightbox'],
  [about18Schema.code]: ['progress-bar'],
  [about21Schema.code]: ['lightbox'],
  [about24Schema.code]: ['progress-bar'],
  [facts13Schema.code]: ['progress-bar'],
  [facts16Schema.code]: ['progress-bar'],
  [hero3Schema.code]: ['lightbox'],
};

export const PluginsMap = Object.fromEntries(
  Object.entries(pluginsMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
);
