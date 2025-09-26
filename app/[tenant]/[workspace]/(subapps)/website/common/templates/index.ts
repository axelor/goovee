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
import {CTA6, cta6Schema} from './cta-6';
import {CTA7, cta7Schema} from './cta-7';
import {CTA8, cta8Schema} from './cta-8';
import {CTA9, cta9Schema} from './cta-9';
import {Facts1, facts1Schema} from './facts-1';
import {Facts2, facts2Schema} from './facts-2';
import {Facts3, facts3Schema} from './facts-3';
import {Facts4, facts4Schema} from './facts-4';
import {Facts5, facts5Schema} from './facts-5';
import {Facts6, facts6Schema} from './facts-6';
import {Facts7, facts7Schema} from './facts-7';
import {Facts8, facts8Schema} from './facts-8';
import {Facts9, facts9Schema} from './facts-9';
import {Facts10, facts10Schema} from './facts-10';
import {Facts11, facts11Schema} from './facts-11';
import {Facts12, facts12Schema} from './facts-12';
import {Facts13, facts13Schema} from './facts-13';
import {Facts14, facts14Schema} from './facts-14';
import {Facts15, facts15Schema} from './facts-15';
import {Facts16, facts16Schema} from './facts-16';
import {Facts17, facts17Schema} from './facts-17';
import {FAQ1, faq1Schema} from './faq-1';
import {FAQ2, faq2Schema} from './faq-2';
import {FAQ3, faq3Schema} from './faq-3';
import {FAQ4, faq4Schema} from './faq-4';
import {FAQ5, faq5Schema} from './faq-5';
import {FAQ6, faq6Schema} from './faq-6';
import {Footer1, footer1Schema} from './footer-1';
import {Footer2, footer2Schema} from './footer-2';
import {Footer3, footer3Schema} from './footer-3';
import {Footer4, footer4Schema} from './footer-4';
import {Footer5, footer5Schema} from './footer-5';
import {Footer6, footer6Schema} from './footer-6';
import {Footer7, footer7Schema} from './footer-7';
import {Footer8, footer8Schema} from './footer-8';
import {Footer9, footer9Schema} from './footer-9';
import {Footer10, footer10Schema} from './footer-10';
import {Footer11, footer11Schema} from './footer-11';
import {Footer12, footer12Schema} from './footer-12';
import {Footer13, footer13Schema} from './footer-13';
import {Footer14, footer14Schema} from './footer-14';
import {Footer15, footer15Schema} from './footer-15';
import {Hero1, hero1Schema} from './hero-1';
import {Hero2, hero2Schema} from './hero-2';
import {Hero3, hero3Schema} from './hero-3';
import {Hero4, hero4Schema} from './hero-4';
import {Hero5, hero5Schema} from './hero-5';
import {Hero6, hero6Schema} from './hero-6';
import {Hero7, hero7Schema} from './hero-7';
import {Hero8, hero8Schema} from './hero-8';
import {Hero9, hero9Schema} from './hero-9';
import {Hero10, hero10Schema} from './hero-10';
import {Hero11, hero11Schema} from './hero-11';
import {Hero12, hero12Schema} from './hero-12';
import {Hero13, hero13Schema} from './hero-13';
import {Hero14, hero14Schema} from './hero-14';
import {Hero15, hero15Schema} from './hero-15';
import {Hero16, hero16Schema} from './hero-16';
import {Hero17, hero17Schema} from './hero-17';
import {Hero18, hero18Schema} from './hero-18';
import {Hero19, hero19Schema} from './hero-19';
import {Hero20, hero20Schema} from './hero-20';
import {Hero21, hero21Schema} from './hero-21';
import {Hero22, hero22Schema} from './hero-22';
import {Hero23, hero23Schema} from './hero-23';
import {Hero24, hero24Schema} from './hero-24';
import {Navbar1, navbar1Schema} from './navbar-1';
import {PageProgress1, pageProgress1Schema} from './page-progress-1';
import {Pricing1, pricing1Schema} from './pricing-1';
import {Pricing2, pricing2Schema} from './pricing-2';
import {Pricing3, pricing3Schema} from './pricing-3';
import {Pricing4, pricing4Schema} from './pricing-4';
import {Pricing5, pricing5Schema} from './pricing-5';
import {Pricing6, pricing6Schema} from './pricing-6';
import {Pricing7, pricing7Schema} from './pricing-7';
import {Pricing8, pricing8Schema} from './pricing-8';
import {Portfolio1, portfolio1Schema} from './portfolio-1';
import {Portfolio2, portfolio2Schema} from './portfolio-2';
import {Portfolio3, portfolio3Schema} from './portfolio-3';
import {Portfolio4, portfolio4Schema} from './portfolio-4';
import {Portfolio5, portfolio5Schema} from './portfolio-5';
import {Portfolio6, portfolio6Schema} from './portfolio-6';
import {Portfolio7, portfolio7Schema} from './portfolio-7';
import {Portfolio8, portfolio8Schema} from './portfolio-8';
import {Portfolio9, portfolio9Schema} from './portfolio-9';
import {Portfolio10, portfolio10Schema} from './portfolio-10';
import {Portfolio11, portfolio11Schema} from './portfolio-11';
import {Process1, process1Schema} from './process-1';
import {Process2, process2Schema} from './process-2';
import {Process3, process3Schema} from './process-3';
import {Process4, process4Schema} from './process-4';
import {Process5, process5Schema} from './process-5';
import {Process6, process6Schema} from './process-6';
import {Process7, process7Schema} from './process-7';
import {Process9, process9Schema} from './process-9';
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
  [hero2Schema.code]: Hero2,
  [hero3Schema.code]: Hero3,
  [hero4Schema.code]: Hero4,
  [hero5Schema.code]: Hero5,
  [hero6Schema.code]: Hero6,
  [hero7Schema.code]: Hero7,
  [hero8Schema.code]: Hero8,
  [hero9Schema.code]: Hero9,
  [hero10Schema.code]: Hero10,
  [hero11Schema.code]: Hero11,
  [hero12Schema.code]: Hero12,
  [hero13Schema.code]: Hero13,
  [hero14Schema.code]: Hero14,
  [hero15Schema.code]: Hero15,
  [hero16Schema.code]: Hero16,
  [hero17Schema.code]: Hero17,
  [hero18Schema.code]: Hero18,
  [hero19Schema.code]: Hero19,
  [hero20Schema.code]: Hero20,
  [hero21Schema.code]: Hero21,
  [hero22Schema.code]: Hero22,
  [hero23Schema.code]: Hero23,
  [hero24Schema.code]: Hero24,
  [pageProgress1Schema.code]: PageProgress1,
  [services1Schema.code]: Services1,
  [cta1Schema.code]: CTA1,
  [cta2Schema.code]: CTA2,
  [cta3Schema.code]: CTA3,
  [cta4Schema.code]: CTA4,
  [cta5Schema.code]: CTA5,
  [cta6Schema.code]: CTA6,
  [cta7Schema.code]: CTA7,
  [cta8Schema.code]: CTA8,
  [cta9Schema.code]: CTA9,
  [facts1Schema.code]: Facts1,
  [facts2Schema.code]: Facts2,
  [facts3Schema.code]: Facts3,
  [facts4Schema.code]: Facts4,
  [facts5Schema.code]: Facts5,
  [facts6Schema.code]: Facts6,
  [facts7Schema.code]: Facts7,
  [facts8Schema.code]: Facts8,
  [facts9Schema.code]: Facts9,
  [facts10Schema.code]: Facts10,
  [facts11Schema.code]: Facts11,
  [facts12Schema.code]: Facts12,
  [facts13Schema.code]: Facts13,
  [facts14Schema.code]: Facts14,
  [facts15Schema.code]: Facts15,
  [facts16Schema.code]: Facts16,
  [facts17Schema.code]: Facts17,
  [faq1Schema.code]: FAQ1,
  [faq2Schema.code]: FAQ2,
  [faq3Schema.code]: FAQ3,
  [faq4Schema.code]: FAQ4,
  [faq5Schema.code]: FAQ5,
  [faq6Schema.code]: FAQ6,
  [process1Schema.code]: Process1,
  [process2Schema.code]: Process2,
  [process3Schema.code]: Process3,
  [process4Schema.code]: Process4,
  [process5Schema.code]: Process5,
  [process6Schema.code]: Process6,
  [process7Schema.code]: Process7,
  [process9Schema.code]: Process9,
  [team1Schema.code]: Team1,
  [services2Schema.code]: Services2,
  [testimonial1Schema.code]: Testimonial1,
  [pricing1Schema.code]: Pricing1,
  [pricing2Schema.code]: Pricing2,
  [pricing3Schema.code]: Pricing3,
  [pricing4Schema.code]: Pricing4,
  [pricing5Schema.code]: Pricing5,
  [pricing6Schema.code]: Pricing6,
  [pricing7Schema.code]: Pricing7,
  [pricing8Schema.code]: Pricing8,
  [portfolio1Schema.code]: Portfolio1,
  [portfolio2Schema.code]: Portfolio2,
  [portfolio3Schema.code]: Portfolio3,
  [portfolio4Schema.code]: Portfolio4,
  [portfolio5Schema.code]: Portfolio5,
  [portfolio6Schema.code]: Portfolio6,
  [portfolio7Schema.code]: Portfolio7,
  [portfolio8Schema.code]: Portfolio8,
  [portfolio9Schema.code]: Portfolio9,
  [portfolio10Schema.code]: Portfolio10,
  [portfolio11Schema.code]: Portfolio11,
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
  [footer2Schema.code]: Footer2,
  [footer3Schema.code]: Footer3,
  [footer4Schema.code]: Footer4,
  [footer5Schema.code]: Footer5,
  [footer6Schema.code]: Footer6,
  [footer7Schema.code]: Footer7,
  [footer8Schema.code]: Footer8,
  [footer9Schema.code]: Footer9,
  [footer10Schema.code]: Footer10,
  [footer11Schema.code]: Footer11,
  [footer12Schema.code]: Footer12,
  [footer13Schema.code]: Footer13,
  [footer14Schema.code]: Footer14,
  [footer15Schema.code]: Footer15,
  [wiki1Schema.code]: Wiki1,
  [sidebarMenu1Schema.code]: SidebarMenu1,
};

export const ComponentMap = Object.fromEntries(
  Object.entries(componentMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
) as Record<string, ComponentType<TemplateProps>>;
