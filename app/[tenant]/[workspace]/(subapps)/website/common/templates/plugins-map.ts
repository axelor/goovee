import {formatComponentCode} from '../utils/helper';
import {about10Code} from './about-10/meta';
import {about13Code} from './about-13/meta';
import {about18Code} from './about-18/meta';
import {about2Code} from './about-2/meta';
import {about5Code} from './about-5/meta';
import {about21Code} from './about-21/meta';
import {about24Code} from './about-24/meta';
import {facts13Code} from './facts-13/meta';
import {facts16Code} from './facts-16/meta';
import {faq1Code} from './faq-1/meta';
import {hero3Code} from './hero-3/meta';
import {hero11Code} from './hero-11/meta';
import {hero13Code} from './hero-13/meta';
import {hero15Code} from './hero-15/meta';
import {hero20Code} from './hero-20/meta';
import {hero21Code} from './hero-21/meta';
import {hero22Code} from './hero-22/meta';
import {hero24Code} from './hero-24/meta';
import {portfolio5Code} from './portfolio-5/meta';
import {portfolio10Code} from './portfolio-10/meta';
import {portfolio11Code} from './portfolio-11/meta';
import {portfolio12Code} from './portfolio-12/meta';
import {process9Code} from './process-9/meta';
import {service18Code} from './service-18/meta';
import {banner3Code} from './banner-3/meta';
import {banner6Code} from './banner-6/meta';

const pluginsMap = {
  [about2Code]: ['lightbox'],
  [about5Code]: ['progress-bar'],
  [about10Code]: ['progress-bar', 'lightbox'],
  [about13Code]: ['lightbox'],
  [about18Code]: ['progress-bar'],
  [about21Code]: ['lightbox'],
  [about24Code]: ['progress-bar'],
  [facts13Code]: ['progress-bar'],
  [facts16Code]: ['progress-bar'],
  [faq1Code]: ['lightbox'],
  [hero3Code]: ['lightbox'],
  [hero11Code]: ['lightbox'],
  [hero13Code]: ['lightbox'],
  [hero15Code]: ['lightbox'],
  [hero20Code]: ['replace-me'],
  [hero21Code]: ['replace-me'],
  [hero22Code]: ['lightbox'],
  [hero24Code]: ['lightbox'],
  [portfolio5Code]: ['lightbox'],
  [portfolio10Code]: ['lightbox'],
  [portfolio11Code]: ['lightbox'],
  [portfolio12Code]: ['lightbox'],
  [process9Code]: ['lightbox'],
  [service18Code]: ['progress-bar'],
  [banner3Code]: ['lightbox'],
  [banner6Code]: ['lightbox'],
};

export const PluginsMap = Object.fromEntries(
  Object.entries(pluginsMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
);
