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
import {hero11Schema} from './hero-11/meta';
import {hero13Schema} from './hero-13/meta';
import {hero15Schema} from './hero-15/meta';
import {hero22Schema} from './hero-22/meta';
import {hero24Schema} from './hero-24/meta';
import {portfolio5Schema} from './portfolio-5/meta';
import {portfolio10Schema} from './portfolio-10/meta';
import {portfolio11Schema} from './portfolio-11/meta';
import {portfolio12Schema} from './portfolio-12/meta';
import {process9Schema} from './process-9/meta';
import {service18Schema} from './service-18/meta';
import {banner3Schema} from './banner-3/meta';
import {banner6Schema} from './banner-6/meta';

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
  [hero11Schema.code]: ['lightbox'],
  [hero13Schema.code]: ['lightbox'],
  [hero15Schema.code]: ['lightbox'],
  [hero22Schema.code]: ['lightbox'],
  [hero24Schema.code]: ['lightbox'],
  [portfolio5Schema.code]: ['lightbox'],
  [portfolio10Schema.code]: ['lightbox'],
  [portfolio11Schema.code]: ['lightbox'],
  [portfolio12Schema.code]: ['lightbox'],
  [process9Schema.code]: ['lightbox'],
  [service18Schema.code]: ['progress-bar'],
  [banner3Schema.code]: ['lightbox'],
  [banner6Schema.code]: ['lightbox'],
};

export const PluginsMap = Object.fromEntries(
  Object.entries(pluginsMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
);
