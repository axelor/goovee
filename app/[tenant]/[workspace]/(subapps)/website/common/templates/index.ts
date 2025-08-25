import {ComponentType} from 'react';

import type {TemplateProps} from '../types';
import {formatComponentCode} from '../utils/templates';

import {About1, about1Schema} from './about-1';
import {About2, about2Schema} from './about-2';
import {About3, about3Schema} from './about-3';
import {About4, about4Schema} from './about-4';
import {About5, about5Schema} from './about-5';
import {About6, about6Schema} from './about-6';
import {About7, about7Schema} from './about-7';
import {About8, about8Schema} from './about-8';
import {About9, about9Schema} from './about-9';
import {About10, about10Schema} from './about-10';
import {About11, about11Schema} from './about-11';
import {About12, about12Schema} from './about-12';
import {About13, about13Schema} from './about-13';
import {About14, about14Schema} from './about-14';
import {About15, about15Schema} from './about-15';
import {About16, about16Schema} from './about-16';
import {Clients1, clients1Schema} from './clients-1';
import {Contact4, contact4Schema} from './contacts-4';
import {CTA1, cta1Schema} from './cta-1';
import {Footer1, footer1Schema} from './footer-1';
import {Hero1, hero1Schema} from './hero-1';
import {Navbar1, navbar1Schema} from './navbar-1';
import {PageProgress1, pageProgress1Schema} from './page-progress-1';
import {Pricing1, pricing1Schema} from './pricing-1';
import {Process1, process1Schema} from './process-1';
import {Services1, services1Schema} from './services-1';
import {Services2, services2Schema} from './services-2';
import {SidebarMenu1, sidebarMenu1Schema} from './sidebar-menu-1';
import {Team1, team1Schema} from './team-1';
import {Testimonial1, testimonial1Schema} from './testimonial-1';
import {Wiki1, wiki1Schema} from './wiki-1';

const componentMap: Record<string, ComponentType<TemplateProps>> = {
  [about1Schema.code]: About1,
  [about2Schema.code]: About2,
  [about3Schema.code]: About3,
  [about4Schema.code]: About4,
  [about5Schema.code]: About5,
  [about6Schema.code]: About6,
  [about7Schema.code]: About7,
  [about8Schema.code]: About8,
  [about9Schema.code]: About9,
  [about10Schema.code]: About10,
  [about11Schema.code]: About11,
  [about12Schema.code]: About12,
  [about13Schema.code]: About13,
  [about14Schema.code]: About14,
  [about15Schema.code]: About15,
  [about16Schema.code]: About16,
  [hero1Schema.code]: Hero1,
  [pageProgress1Schema.code]: PageProgress1,
  [services1Schema.code]: Services1,
  [cta1Schema.code]: CTA1,
  [process1Schema.code]: Process1,
  [team1Schema.code]: Team1,
  [services2Schema.code]: Services2,
  [testimonial1Schema.code]: Testimonial1,
  [pricing1Schema.code]: Pricing1,
  [contact4Schema.code]: Contact4,
  [clients1Schema.code]: Clients1,
  [navbar1Schema.code]: Navbar1,
  [footer1Schema.code]: Footer1,
  [wiki1Schema.code]: Wiki1,
  [sidebarMenu1Schema.code]: SidebarMenu1,
};

export const ComponentMap = Object.fromEntries(
  Object.entries(componentMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
) as Record<string, ComponentType<TemplateProps>>;
