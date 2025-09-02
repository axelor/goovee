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
import {About17, about17Schema} from './about-17';
import {About18, about18Schema} from './about-18';
import {About19, about19Schema} from './about-19';
import {About20, about20Schema} from './about-20';
import {About21, about21Schema} from './about-21';
import {About22, about22Schema} from './about-22';
import {About23, about23Schema} from './about-23';
import {About24, about24Schema} from './about-24';
import {About25, about25Schema} from './about-25';
import {Blog1, blog1Schema} from './blog-1';
import {Blog2, blog2Schema} from './blog-2';
import {Blog3, blog3Schema} from './blog-3';
import {Blog4, blog4Schema} from './blog-4';
import {Blog5, blog5Schema} from './blog-5';
import {Clientlist1, clientlist1Schema} from './clientlist-1';
import {Clientlist2, clientlist2Schema} from './clientlist-2';
import {Clientlist3, clientlist3Schema} from './clientlist-3';
import {Clientlist4, clientlist4Schema} from './clientlist-4';
import {Clientlist5, clientlist5Schema} from './clientlist-5';
import {Contact1, contact1Schema} from './contact-1';
import {Contact2, contact2Schema} from './contact-2';
import {Contact3, contact3Schema} from './contact-3';
import {Contact4, contact4Schema} from './contact-4';
import {Contact5, contact5Schema} from './contact-5';
import {Contact6, contact6Schema} from './contact-6';
import {Contact7, contact7Schema} from './contact-7';
import {Contact8, contact8Schema} from './contact-8';
import {Contact9, contact9Schema} from './contact-9';
import {Contact10, contact10Schema} from './contact-10';
import {Contact11, contact11Schema} from './contact-11';
import {Contact12, contact12Schema} from './contact-12';
import {CTA1, cta1Schema} from './cta-1';
import {CTA2, cta2Schema} from './cta-2';
import {CTA3, cta3Schema} from './cta-3';
import {CTA4, cta4Schema} from './cta-4';
import {CTA5, cta5Schema} from './cta-5';
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
  [about17Schema.code]: About17,
  [about18Schema.code]: About18,
  [about19Schema.code]: About19,
  [about20Schema.code]: About20,
  [about21Schema.code]: About21,
  [about22Schema.code]: About22,
  [about23Schema.code]: About23,
  [about24Schema.code]: About24,
  [about25Schema.code]: About25,
  [blog1Schema.code]: Blog1,
  [blog2Schema.code]: Blog2,
  [blog3Schema.code]: Blog3,
  [blog4Schema.code]: Blog4,
  [blog5Schema.code]: Blog5,
  [hero1Schema.code]: Hero1,
  [pageProgress1Schema.code]: PageProgress1,
  [services1Schema.code]: Services1,
  [cta1Schema.code]: CTA1,
  [cta2Schema.code]: CTA2,
  [cta3Schema.code]: CTA3,
  [cta4Schema.code]: CTA4,
  [cta5Schema.code]: CTA5,
  [process1Schema.code]: Process1,
  [team1Schema.code]: Team1,
  [services2Schema.code]: Services2,
  [testimonial1Schema.code]: Testimonial1,
  [pricing1Schema.code]: Pricing1,
  [contact1Schema.code]: Contact1,
  [contact2Schema.code]: Contact2,
  [contact3Schema.code]: Contact3,
  [contact4Schema.code]: Contact4,
  [contact5Schema.code]: Contact5,
  [contact6Schema.code]: Contact6,
  [contact7Schema.code]: Contact7,
  [contact8Schema.code]: Contact8,
  [contact9Schema.code]: Contact9,
  [contact10Schema.code]: Contact10,
  [contact11Schema.code]: Contact11,
  [contact12Schema.code]: Contact12,
  [clientlist1Schema.code]: Clientlist1,
  [clientlist2Schema.code]: Clientlist2,
  [clientlist3Schema.code]: Clientlist3,
  [clientlist4Schema.code]: Clientlist4,
  [clientlist5Schema.code]: Clientlist5,
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
