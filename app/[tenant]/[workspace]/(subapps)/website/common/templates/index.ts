import {ComponentType} from 'react';
import dynamic from 'next/dynamic';

import type {TemplateProps} from '../types';
import {formatComponentCode} from '../utils/helper';

import {about1Schema} from './about-1';
import {about2Schema} from './about-2';
import {about3Schema} from './about-3';
import {about4Schema} from './about-4';
import {about5Schema} from './about-5';
import {about6Schema} from './about-6';
import {about7Schema} from './about-7';
import {about8Schema} from './about-8';
import {about9Schema} from './about-9';
import {about10Schema} from './about-10';
import {about11Schema} from './about-11';
import {about12Schema} from './about-12';
import {about13Schema} from './about-13';
import {about14Schema} from './about-14';
import {about15Schema} from './about-15';
import {about16Schema} from './about-16';
import {about17Schema} from './about-17';
import {about18Schema} from './about-18';
import {about19Schema} from './about-19';
import {about20Schema} from './about-20';
import {about21Schema} from './about-21';
import {about22Schema} from './about-22';
import {about23Schema} from './about-23';
import {about24Schema} from './about-24';
import {about25Schema} from './about-25';
import {blog1Schema} from './blog-1';
import {blog2Schema} from './blog-2';
import {blog3Schema} from './blog-3';
import {blog4Schema} from './blog-4';
import {blog5Schema} from './blog-5';
import {banner1Schema} from './banner-1';
import {banner2Schema} from './banner-2';
import {banner3Schema} from './banner-3';
import {banner5Schema} from './banner-5';
import {banner6Schema} from './banner-6';
import {clientlist1Schema} from './clientlist-1';
import {clientlist2Schema} from './clientlist-2';
import {clientlist3Schema} from './clientlist-3';
import {clientlist4Schema} from './clientlist-4';
import {clientlist5Schema} from './clientlist-5';
import {contact1Schema} from './contact-1';
import {contact2Schema} from './contact-2';
import {contact3Schema} from './contact-3';
import {contact4Schema} from './contact-4';
import {contact5Schema} from './contact-5';
import {contact6Schema} from './contact-6';
import {contact7Schema} from './contact-7';
import {contact8Schema} from './contact-8';
import {contact9Schema} from './contact-9';
import {contact10Schema} from './contact-10';
import {contact11Schema} from './contact-11';
import {contact12Schema} from './contact-12';
import {cta1Schema} from './cta-1';
import {cta2Schema} from './cta-2';
import {cta3Schema} from './cta-3';
import {cta4Schema} from './cta-4';
import {cta5Schema} from './cta-5';
import {cta6Schema} from './cta-6';
import {cta7Schema} from './cta-7';
import {cta8Schema} from './cta-8';
import {cta9Schema} from './cta-9';
import {facts1Schema} from './facts-1';
import {facts2Schema} from './facts-2';
import {facts3Schema} from './facts-3';
import {facts4Schema} from './facts-4';
import {facts5Schema} from './facts-5';
import {facts6Schema} from './facts-6';
import {facts7Schema} from './facts-7';
import {facts8Schema} from './facts-8';
import {facts9Schema} from './facts-9';
import {facts10Schema} from './facts-10';
import {facts11Schema} from './facts-11';
import {facts12Schema} from './facts-12';
import {facts13Schema} from './facts-13';
import {facts14Schema} from './facts-14';
import {facts15Schema} from './facts-15';
import {facts16Schema} from './facts-16';
import {facts17Schema} from './facts-17';
import {faq1Schema} from './faq-1';
import {faq2Schema} from './faq-2';
import {faq3Schema} from './faq-3';
import {faq4Schema} from './faq-4';
import {faq5Schema} from './faq-5';
import {faq6Schema} from './faq-6';
import {footer1Schema} from './footer-1';
import {footer2Schema} from './footer-2';
import {footer3Schema} from './footer-3';
import {footer4Schema} from './footer-4';
import {footer5Schema} from './footer-5';
import {footer6Schema} from './footer-6';
import {footer7Schema} from './footer-7';
import {footer8Schema} from './footer-8';
import {footer9Schema} from './footer-9';
import {footer10Schema} from './footer-10';
import {footer11Schema} from './footer-11';
import {footer12Schema} from './footer-12';
import {footer13Schema} from './footer-13';
import {footer14Schema} from './footer-14';
import {footer15Schema} from './footer-15';
import {hero1Schema} from './hero-1';
import {hero2Schema} from './hero-2';
import {hero3Schema} from './hero-3';
import {hero4Schema} from './hero-4';
import {hero5Schema} from './hero-5';
import {hero6Schema} from './hero-6';
import {hero7Schema} from './hero-7';
import {hero8Schema} from './hero-8';
import {hero9Schema} from './hero-9';
import {hero10Schema} from './hero-10';
import {hero11Schema} from './hero-11';
import {hero12Schema} from './hero-12';
import {hero13Schema} from './hero-13';
import {hero14Schema} from './hero-14';
import {hero15Schema} from './hero-15';
import {hero16Schema} from './hero-16';
import {hero17Schema} from './hero-17';
import {hero18Schema} from './hero-18';
import {hero19Schema} from './hero-19';
import {hero20Schema} from './hero-20';
import {hero21Schema} from './hero-21';
import {hero22Schema} from './hero-22';
import {hero23Schema} from './hero-23';
import {hero24Schema} from './hero-24';
import {hr1Schema} from './hr-1';
import {navbar1Schema} from './navbar-1';
import {pageProgress1Schema} from './page-progress-1';
import {pricing1Schema} from './pricing-1';
import {pricing2Schema} from './pricing-2';
import {pricing3Schema} from './pricing-3';
import {pricing4Schema} from './pricing-4';
import {pricing5Schema} from './pricing-5';
import {pricing6Schema} from './pricing-6';
import {pricing7Schema} from './pricing-7';
import {pricing8Schema} from './pricing-8';
import {portfolio1Schema} from './portfolio-1';
import {portfolio2Schema} from './portfolio-2';
import {portfolio3Schema} from './portfolio-3';
import {portfolio4Schema} from './portfolio-4';
import {portfolio5Schema} from './portfolio-5';
import {portfolio6Schema} from './portfolio-6';
import {portfolio7Schema} from './portfolio-7';
import {portfolio8Schema} from './portfolio-8';
import {portfolio9Schema} from './portfolio-9';
import {portfolio10Schema} from './portfolio-10';
import {portfolio11Schema} from './portfolio-11';
import {portfolio12Schema} from './portfolio-12';
import {process1Schema} from './process-1';
import {process2Schema} from './process-2';
import {process3Schema} from './process-3';
import {process4Schema} from './process-4';
import {process5Schema} from './process-5';
import {process6Schema} from './process-6';
import {process7Schema} from './process-7';
import {process9Schema} from './process-9';
import {process10Schema} from './process-10';
import {process11Schema} from './process-11';
import {process12Schema} from './process-12';
import {process13Schema} from './process-13';
import {process14Schema} from './process-14';
import {process15Schema} from './process-15';
import {service1Schema} from './service-1';
import {service2Schema} from './service-2';
import {service3Schema} from './service-3';
import {service4Schema} from './service-4';
import {service5Schema} from './service-5';
import {service6Schema} from './service-6';
import {service7Schema} from './service-7';
import {service8Schema} from './service-8';
import {service9Schema} from './service-9';
import {service10Schema} from './service-10';
import {service11Schema} from './service-11';
import {service12Schema} from './service-12';
import {service13Schema} from './service-13';
import {service14Schema} from './service-14';
import {service15Schema} from './service-15';
import {service16Schema} from './service-16';
import {service17Schema} from './service-17';
import {service18Schema} from './service-18';
import {service19Schema} from './service-19';
import {service20Schema} from './service-20';
import {service21Schema} from './service-21';
import {service22Schema} from './service-22';
import {service23Schema} from './service-23';
import {service24Schema} from './service-24';
import {service25Schema} from './service-25';
import {service26Schema} from './service-26';
import {service27Schema} from './service-27';
import {sidebarMenu1Schema} from './sidebar-menu-1';
import {team1Schema} from './team-1';
import {team2Schema} from './team-2';
import {team3Schema} from './team-3';
import {team4Schema} from './team-4';
import {team5Schema} from './team-5';
import {team6Schema} from './team-6';
import {team7Schema} from './team-7';
import {testimonial1Schema} from './testimonial-1';
import {testimonial2Schema} from './testimonial-2';
import {testimonial3Schema} from './testimonial-3';
import {testimonial4Schema} from './testimonial-4';
import {testimonial5Schema} from './testimonial-5';
import {testimonial6Schema} from './testimonial-6';
import {testimonial7Schema} from './testimonial-7';
import {testimonial8Schema} from './testimonial-8';
import {testimonial9Schema} from './testimonial-9';
import {testimonial10Schema} from './testimonial-10';
import {testimonial11Schema} from './testimonial-11';
import {testimonial12Schema} from './testimonial-12';
import {testimonial13Schema} from './testimonial-13';
import {testimonial14Schema} from './testimonial-14';
import {testimonial15Schema} from './testimonial-15';
import {testimonial16Schema} from './testimonial-16';
import {testimonial17Schema} from './testimonial-17';
import {testimonial18Schema} from './testimonial-18';
import {testimonial19Schema} from './testimonial-19';
import {wiki1Schema} from './wiki-1';

const componentMap: Record<string, ComponentType<TemplateProps>> = {
  [about1Schema.code]: dynamic(() =>
    import('./about-1').then(mod => mod.About1),
  ),
  [about2Schema.code]: dynamic(() =>
    import('./about-2').then(mod => mod.About2),
  ),
  [about3Schema.code]: dynamic(() =>
    import('./about-3').then(mod => mod.About3),
  ),
  [about4Schema.code]: dynamic(() =>
    import('./about-4').then(mod => mod.About4),
  ),
  [about5Schema.code]: dynamic(() =>
    import('./about-5').then(mod => mod.About5),
  ),
  [about6Schema.code]: dynamic(() =>
    import('./about-6').then(mod => mod.About6),
  ),
  [about7Schema.code]: dynamic(() =>
    import('./about-7').then(mod => mod.About7),
  ),
  [about8Schema.code]: dynamic(() =>
    import('./about-8').then(mod => mod.About8),
  ),
  [about9Schema.code]: dynamic(() =>
    import('./about-9').then(mod => mod.About9),
  ),
  [about10Schema.code]: dynamic(() =>
    import('./about-10').then(mod => mod.About10),
  ),
  [about11Schema.code]: dynamic(() =>
    import('./about-11').then(mod => mod.About11),
  ),
  [about12Schema.code]: dynamic(() =>
    import('./about-12').then(mod => mod.About12),
  ),
  [about13Schema.code]: dynamic(() =>
    import('./about-13').then(mod => mod.About13),
  ),
  [about14Schema.code]: dynamic(() =>
    import('./about-14').then(mod => mod.About14),
  ),
  [about15Schema.code]: dynamic(() =>
    import('./about-15').then(mod => mod.About15),
  ),
  [about16Schema.code]: dynamic(() =>
    import('./about-16').then(mod => mod.About16),
  ),
  [about17Schema.code]: dynamic(() =>
    import('./about-17').then(mod => mod.About17),
  ),
  [about18Schema.code]: dynamic(() =>
    import('./about-18').then(mod => mod.About18),
  ),
  [about19Schema.code]: dynamic(() =>
    import('./about-19').then(mod => mod.About19),
  ),
  [about20Schema.code]: dynamic(() =>
    import('./about-20').then(mod => mod.About20),
  ),
  [about21Schema.code]: dynamic(() =>
    import('./about-21').then(mod => mod.About21),
  ),
  [about22Schema.code]: dynamic(() =>
    import('./about-22').then(mod => mod.About22),
  ),
  [about23Schema.code]: dynamic(() =>
    import('./about-23').then(mod => mod.About23),
  ),
  [about24Schema.code]: dynamic(() =>
    import('./about-24').then(mod => mod.About24),
  ),
  [about25Schema.code]: dynamic(() =>
    import('./about-25').then(mod => mod.About25),
  ),
  [blog1Schema.code]: dynamic(() => import('./blog-1').then(mod => mod.Blog1)),
  [blog2Schema.code]: dynamic(() => import('./blog-2').then(mod => mod.Blog2)),
  [blog3Schema.code]: dynamic(() => import('./blog-3').then(mod => mod.Blog3)),
  [blog4Schema.code]: dynamic(() => import('./blog-4').then(mod => mod.Blog4)),
  [blog5Schema.code]: dynamic(() => import('./blog-5').then(mod => mod.Blog5)),
  [banner1Schema.code]: dynamic(() =>
    import('./banner-1').then(mod => mod.Banner1),
  ),
  [banner2Schema.code]: dynamic(() =>
    import('./banner-2').then(mod => mod.Banner2),
  ),
  [banner3Schema.code]: dynamic(() =>
    import('./banner-3').then(mod => mod.Banner3),
  ),
  [banner5Schema.code]: dynamic(() =>
    import('./banner-5').then(mod => mod.Banner5),
  ),
  [banner6Schema.code]: dynamic(() =>
    import('./banner-6').then(mod => mod.Banner6),
  ),
  [hero1Schema.code]: dynamic(() => import('./hero-1').then(mod => mod.Hero1)),
  [hero2Schema.code]: dynamic(() => import('./hero-2').then(mod => mod.Hero2)),
  [hero3Schema.code]: dynamic(() => import('./hero-3').then(mod => mod.Hero3)),
  [hero4Schema.code]: dynamic(() => import('./hero-4').then(mod => mod.Hero4)),
  [hero5Schema.code]: dynamic(() => import('./hero-5').then(mod => mod.Hero5)),
  [hero6Schema.code]: dynamic(() => import('./hero-6').then(mod => mod.Hero6)),
  [hero7Schema.code]: dynamic(() => import('./hero-7').then(mod => mod.Hero7)),
  [hero8Schema.code]: dynamic(() => import('./hero-8').then(mod => mod.Hero8)),
  [hero9Schema.code]: dynamic(() => import('./hero-9').then(mod => mod.Hero9)),
  [hero10Schema.code]: dynamic(() =>
    import('./hero-10').then(mod => mod.Hero10),
  ),
  [hero11Schema.code]: dynamic(() =>
    import('./hero-11').then(mod => mod.Hero11),
  ),
  [hero12Schema.code]: dynamic(() =>
    import('./hero-12').then(mod => mod.Hero12),
  ),
  [hero13Schema.code]: dynamic(() =>
    import('./hero-13').then(mod => mod.Hero13),
  ),
  [hero14Schema.code]: dynamic(() =>
    import('./hero-14').then(mod => mod.Hero14),
  ),
  [hero15Schema.code]: dynamic(() =>
    import('./hero-15').then(mod => mod.Hero15),
  ),
  [hero16Schema.code]: dynamic(() =>
    import('./hero-16').then(mod => mod.Hero16),
  ),
  [hero17Schema.code]: dynamic(() =>
    import('./hero-17').then(mod => mod.Hero17),
  ),
  [hero18Schema.code]: dynamic(() =>
    import('./hero-18').then(mod => mod.Hero18),
  ),
  [hero19Schema.code]: dynamic(() =>
    import('./hero-19').then(mod => mod.Hero19),
  ),
  [hero20Schema.code]: dynamic(() =>
    import('./hero-20').then(mod => mod.Hero20),
  ),
  [hero21Schema.code]: dynamic(() =>
    import('./hero-21').then(mod => mod.Hero21),
  ),
  [hero22Schema.code]: dynamic(() =>
    import('./hero-22').then(mod => mod.Hero22),
  ),
  [hero23Schema.code]: dynamic(() =>
    import('./hero-23').then(mod => mod.Hero23),
  ),
  [hero24Schema.code]: dynamic(() =>
    import('./hero-24').then(mod => mod.Hero24),
  ),
  [hr1Schema.code]: dynamic(() => import('./hr-1').then(mod => mod.HR1)),
  [pageProgress1Schema.code]: dynamic(() =>
    import('./page-progress-1').then(mod => mod.PageProgress1),
  ),
  [cta1Schema.code]: dynamic(() => import('./cta-1').then(mod => mod.CTA1)),
  [cta2Schema.code]: dynamic(() => import('./cta-2').then(mod => mod.CTA2)),
  [cta3Schema.code]: dynamic(() => import('./cta-3').then(mod => mod.CTA3)),
  [cta4Schema.code]: dynamic(() => import('./cta-4').then(mod => mod.CTA4)),
  [cta5Schema.code]: dynamic(() => import('./cta-5').then(mod => mod.CTA5)),
  [cta6Schema.code]: dynamic(() => import('./cta-6').then(mod => mod.CTA6)),
  [cta7Schema.code]: dynamic(() => import('./cta-7').then(mod => mod.CTA7)),
  [cta8Schema.code]: dynamic(() => import('./cta-8').then(mod => mod.CTA8)),
  [cta9Schema.code]: dynamic(() => import('./cta-9').then(mod => mod.CTA9)),
  [facts1Schema.code]: dynamic(() =>
    import('./facts-1').then(mod => mod.Facts1),
  ),
  [facts2Schema.code]: dynamic(() =>
    import('./facts-2').then(mod => mod.Facts2),
  ),
  [facts3Schema.code]: dynamic(() =>
    import('./facts-3').then(mod => mod.Facts3),
  ),
  [facts4Schema.code]: dynamic(() =>
    import('./facts-4').then(mod => mod.Facts4),
  ),
  [facts5Schema.code]: dynamic(() =>
    import('./facts-5').then(mod => mod.Facts5),
  ),
  [facts6Schema.code]: dynamic(() =>
    import('./facts-6').then(mod => mod.Facts6),
  ),
  [facts7Schema.code]: dynamic(() =>
    import('./facts-7').then(mod => mod.Facts7),
  ),
  [facts8Schema.code]: dynamic(() =>
    import('./facts-8').then(mod => mod.Facts8),
  ),
  [facts9Schema.code]: dynamic(() =>
    import('./facts-9').then(mod => mod.Facts9),
  ),
  [facts10Schema.code]: dynamic(() =>
    import('./facts-10').then(mod => mod.Facts10),
  ),
  [facts11Schema.code]: dynamic(() =>
    import('./facts-11').then(mod => mod.Facts11),
  ),
  [facts12Schema.code]: dynamic(() =>
    import('./facts-12').then(mod => mod.Facts12),
  ),
  [facts13Schema.code]: dynamic(() =>
    import('./facts-13').then(mod => mod.Facts13),
  ),
  [facts14Schema.code]: dynamic(() =>
    import('./facts-14').then(mod => mod.Facts14),
  ),
  [facts15Schema.code]: dynamic(() =>
    import('./facts-15').then(mod => mod.Facts15),
  ),
  [facts16Schema.code]: dynamic(() =>
    import('./facts-16').then(mod => mod.Facts16),
  ),
  [facts17Schema.code]: dynamic(() =>
    import('./facts-17').then(mod => mod.Facts17),
  ),
  [faq1Schema.code]: dynamic(() => import('./faq-1').then(mod => mod.FAQ1)),
  [faq2Schema.code]: dynamic(() => import('./faq-2').then(mod => mod.FAQ2)),
  [faq3Schema.code]: dynamic(() => import('./faq-3').then(mod => mod.FAQ3)),
  [faq4Schema.code]: dynamic(() => import('./faq-4').then(mod => mod.FAQ4)),
  [faq5Schema.code]: dynamic(() => import('./faq-5').then(mod => mod.FAQ5)),
  [faq6Schema.code]: dynamic(() => import('./faq-6').then(mod => mod.FAQ6)),
  [process1Schema.code]: dynamic(() =>
    import('./process-1').then(mod => mod.Process1),
  ),
  [process2Schema.code]: dynamic(() =>
    import('./process-2').then(mod => mod.Process2),
  ),
  [process3Schema.code]: dynamic(() =>
    import('./process-3').then(mod => mod.Process3),
  ),
  [process4Schema.code]: dynamic(() =>
    import('./process-4').then(mod => mod.Process4),
  ),
  [process5Schema.code]: dynamic(() =>
    import('./process-5').then(mod => mod.Process5),
  ),
  [process6Schema.code]: dynamic(() =>
    import('./process-6').then(mod => mod.Process6),
  ),
  [process7Schema.code]: dynamic(() =>
    import('./process-7').then(mod => mod.Process7),
  ),
  [process9Schema.code]: dynamic(() =>
    import('./process-9').then(mod => mod.Process9),
  ),
  [process10Schema.code]: dynamic(() =>
    import('./process-10').then(mod => mod.Process10),
  ),
  [process11Schema.code]: dynamic(() =>
    import('./process-11').then(mod => mod.Process11),
  ),
  [process12Schema.code]: dynamic(() =>
    import('./process-12').then(mod => mod.Process12),
  ),
  [process13Schema.code]: dynamic(() =>
    import('./process-13').then(mod => mod.Process13),
  ),
  [process14Schema.code]: dynamic(() =>
    import('./process-14').then(mod => mod.Process14),
  ),
  [process15Schema.code]: dynamic(() =>
    import('./process-15').then(mod => mod.Process15),
  ),
  [team1Schema.code]: dynamic(() => import('./team-1').then(mod => mod.Team1)),
  [team2Schema.code]: dynamic(() => import('./team-2').then(mod => mod.Team2)),
  [team3Schema.code]: dynamic(() => import('./team-3').then(mod => mod.Team3)),
  [team4Schema.code]: dynamic(() => import('./team-4').then(mod => mod.Team4)),
  [team5Schema.code]: dynamic(() => import('./team-5').then(mod => mod.Team5)),
  [team6Schema.code]: dynamic(() => import('./team-6').then(mod => mod.Team6)),
  [team7Schema.code]: dynamic(() => import('./team-7').then(mod => mod.Team7)),
  [service1Schema.code]: dynamic(() =>
    import('./service-1').then(mod => mod.Service1),
  ),
  [service2Schema.code]: dynamic(() =>
    import('./service-2').then(mod => mod.Service2),
  ),
  [service3Schema.code]: dynamic(() =>
    import('./service-3').then(mod => mod.Service3),
  ),
  [service4Schema.code]: dynamic(() =>
    import('./service-4').then(mod => mod.Service4),
  ),
  [service5Schema.code]: dynamic(() =>
    import('./service-5').then(mod => mod.Service5),
  ),
  [service6Schema.code]: dynamic(() =>
    import('./service-6').then(mod => mod.Service6),
  ),
  [service7Schema.code]: dynamic(() =>
    import('./service-7').then(mod => mod.Service7),
  ),
  [service8Schema.code]: dynamic(() =>
    import('./service-8').then(mod => mod.Service8),
  ),
  [service9Schema.code]: dynamic(() =>
    import('./service-9').then(mod => mod.Service9),
  ),
  [service10Schema.code]: dynamic(() =>
    import('./service-10').then(mod => mod.Service10),
  ),
  [service11Schema.code]: dynamic(() =>
    import('./service-11').then(mod => mod.Service11),
  ),
  [service12Schema.code]: dynamic(() =>
    import('./service-12').then(mod => mod.Service12),
  ),
  [service13Schema.code]: dynamic(() =>
    import('./service-13').then(mod => mod.Service13),
  ),
  [service14Schema.code]: dynamic(() =>
    import('./service-14').then(mod => mod.Service14),
  ),
  [service15Schema.code]: dynamic(() =>
    import('./service-15').then(mod => mod.Service15),
  ),
  [service16Schema.code]: dynamic(() =>
    import('./service-16').then(mod => mod.Service16),
  ),
  [service17Schema.code]: dynamic(() =>
    import('./service-17').then(mod => mod.Service17),
  ),
  [service18Schema.code]: dynamic(() =>
    import('./service-18').then(mod => mod.Service18),
  ),
  [service19Schema.code]: dynamic(() =>
    import('./service-19').then(mod => mod.Service19),
  ),
  [service20Schema.code]: dynamic(() =>
    import('./service-20').then(mod => mod.Service20),
  ),
  [service21Schema.code]: dynamic(() =>
    import('./service-21').then(mod => mod.Service21),
  ),
  [service22Schema.code]: dynamic(() =>
    import('./service-22').then(mod => mod.Service22),
  ),
  [service23Schema.code]: dynamic(() =>
    import('./service-23').then(mod => mod.Service23),
  ),
  [service24Schema.code]: dynamic(() =>
    import('./service-24').then(mod => mod.Service24),
  ),
  [service25Schema.code]: dynamic(() =>
    import('./service-25').then(mod => mod.Service25),
  ),
  [service26Schema.code]: dynamic(() =>
    import('./service-26').then(mod => mod.Service26),
  ),
  [service27Schema.code]: dynamic(() =>
    import('./service-27').then(mod => mod.Service27),
  ),
  [testimonial1Schema.code]: dynamic(() =>
    import('./testimonial-1').then(mod => mod.Testimonial1),
  ),
  [testimonial2Schema.code]: dynamic(() =>
    import('./testimonial-2').then(mod => mod.Testimonial2),
  ),
  [testimonial3Schema.code]: dynamic(() =>
    import('./testimonial-3').then(mod => mod.Testimonial3),
  ),
  [testimonial4Schema.code]: dynamic(() =>
    import('./testimonial-4').then(mod => mod.Testimonial4),
  ),
  [testimonial5Schema.code]: dynamic(() =>
    import('./testimonial-5').then(mod => mod.Testimonial5),
  ),
  [testimonial6Schema.code]: dynamic(() =>
    import('./testimonial-6').then(mod => mod.Testimonial6),
  ),
  [testimonial7Schema.code]: dynamic(() =>
    import('./testimonial-7').then(mod => mod.Testimonial7),
  ),
  [testimonial8Schema.code]: dynamic(() =>
    import('./testimonial-8').then(mod => mod.Testimonial8),
  ),
  [testimonial9Schema.code]: dynamic(() =>
    import('./testimonial-9').then(mod => mod.Testimonial9),
  ),
  [testimonial10Schema.code]: dynamic(() =>
    import('./testimonial-10').then(mod => mod.Testimonial10),
  ),
  [testimonial11Schema.code]: dynamic(() =>
    import('./testimonial-11').then(mod => mod.Testimonial11),
  ),
  [testimonial12Schema.code]: dynamic(() =>
    import('./testimonial-12').then(mod => mod.Testimonial12),
  ),
  [testimonial13Schema.code]: dynamic(() =>
    import('./testimonial-13').then(mod => mod.Testimonial13),
  ),
  [testimonial14Schema.code]: dynamic(() =>
    import('./testimonial-14').then(mod => mod.Testimonial14),
  ),
  [testimonial15Schema.code]: dynamic(() =>
    import('./testimonial-15').then(mod => mod.Testimonial15),
  ),
  [testimonial16Schema.code]: dynamic(() =>
    import('./testimonial-16').then(mod => mod.Testimonial16),
  ),
  [testimonial17Schema.code]: dynamic(() =>
    import('./testimonial-17').then(mod => mod.Testimonial17),
  ),
  [testimonial18Schema.code]: dynamic(() =>
    import('./testimonial-18').then(mod => mod.Testimonial18),
  ),
  [testimonial19Schema.code]: dynamic(() =>
    import('./testimonial-19').then(mod => mod.Testimonial19),
  ),
  [pricing1Schema.code]: dynamic(() =>
    import('./pricing-1').then(mod => mod.Pricing1),
  ),
  [pricing2Schema.code]: dynamic(() =>
    import('./pricing-2').then(mod => mod.Pricing2),
  ),
  [pricing3Schema.code]: dynamic(() =>
    import('./pricing-3').then(mod => mod.Pricing3),
  ),
  [pricing4Schema.code]: dynamic(() =>
    import('./pricing-4').then(mod => mod.Pricing4),
  ),
  [pricing5Schema.code]: dynamic(() =>
    import('./pricing-5').then(mod => mod.Pricing5),
  ),
  [pricing6Schema.code]: dynamic(() =>
    import('./pricing-6').then(mod => mod.Pricing6),
  ),
  [pricing7Schema.code]: dynamic(() =>
    import('./pricing-7').then(mod => mod.Pricing7),
  ),
  [pricing8Schema.code]: dynamic(() =>
    import('./pricing-8').then(mod => mod.Pricing8),
  ),
  [portfolio1Schema.code]: dynamic(() =>
    import('./portfolio-1').then(mod => mod.Portfolio1),
  ),
  [portfolio2Schema.code]: dynamic(() =>
    import('./portfolio-2').then(mod => mod.Portfolio2),
  ),
  [portfolio3Schema.code]: dynamic(() =>
    import('./portfolio-3').then(mod => mod.Portfolio3),
  ),
  [portfolio4Schema.code]: dynamic(() =>
    import('./portfolio-4').then(mod => mod.Portfolio4),
  ),
  [portfolio5Schema.code]: dynamic(() =>
    import('./portfolio-5').then(mod => mod.Portfolio5),
  ),
  [portfolio6Schema.code]: dynamic(() =>
    import('./portfolio-6').then(mod => mod.Portfolio6),
  ),
  [portfolio7Schema.code]: dynamic(() =>
    import('./portfolio-7').then(mod => mod.Portfolio7),
  ),
  [portfolio8Schema.code]: dynamic(() =>
    import('./portfolio-8').then(mod => mod.Portfolio8),
  ),
  [portfolio9Schema.code]: dynamic(() =>
    import('./portfolio-9').then(mod => mod.Portfolio9),
  ),
  [portfolio10Schema.code]: dynamic(() =>
    import('./portfolio-10').then(mod => mod.Portfolio10),
  ),
  [portfolio11Schema.code]: dynamic(() =>
    import('./portfolio-11').then(mod => mod.Portfolio11),
  ),
  [portfolio12Schema.code]: dynamic(() =>
    import('./portfolio-12').then(mod => mod.Portfolio12),
  ),
  [contact1Schema.code]: dynamic(() =>
    import('./contact-1').then(mod => mod.Contact1),
  ),
  [contact2Schema.code]: dynamic(() =>
    import('./contact-2').then(mod => mod.Contact2),
  ),
  [contact3Schema.code]: dynamic(() =>
    import('./contact-3').then(mod => mod.Contact3),
  ),
  [contact4Schema.code]: dynamic(() =>
    import('./contact-4').then(mod => mod.Contact4),
  ),
  [contact5Schema.code]: dynamic(() =>
    import('./contact-5').then(mod => mod.Contact5),
  ),
  [contact6Schema.code]: dynamic(() =>
    import('./contact-6').then(mod => mod.Contact6),
  ),
  [contact7Schema.code]: dynamic(() =>
    import('./contact-7').then(mod => mod.Contact7),
  ),
  [contact8Schema.code]: dynamic(() =>
    import('./contact-8').then(mod => mod.Contact8),
  ),
  [contact9Schema.code]: dynamic(() =>
    import('./contact-9').then(mod => mod.Contact9),
  ),
  [contact10Schema.code]: dynamic(() =>
    import('./contact-10').then(mod => mod.Contact10),
  ),
  [contact11Schema.code]: dynamic(() =>
    import('./contact-11').then(mod => mod.Contact11),
  ),
  [contact12Schema.code]: dynamic(() =>
    import('./contact-12').then(mod => mod.Contact12),
  ),
  [clientlist1Schema.code]: dynamic(() =>
    import('./clientlist-1').then(mod => mod.Clientlist1),
  ),
  [clientlist2Schema.code]: dynamic(() =>
    import('./clientlist-2').then(mod => mod.Clientlist2),
  ),
  [clientlist3Schema.code]: dynamic(() =>
    import('./clientlist-3').then(mod => mod.Clientlist3),
  ),
  [clientlist4Schema.code]: dynamic(() =>
    import('./clientlist-4').then(mod => mod.Clientlist4),
  ),
  [clientlist5Schema.code]: dynamic(() =>
    import('./clientlist-5').then(mod => mod.Clientlist5),
  ),
  [navbar1Schema.code]: dynamic(() =>
    import('./navbar-1').then(mod => mod.Navbar1),
  ),
  [footer1Schema.code]: dynamic(() =>
    import('./footer-1').then(mod => mod.Footer1),
  ),
  [footer2Schema.code]: dynamic(() =>
    import('./footer-2').then(mod => mod.Footer2),
  ),
  [footer3Schema.code]: dynamic(() =>
    import('./footer-3').then(mod => mod.Footer3),
  ),
  [footer4Schema.code]: dynamic(() =>
    import('./footer-4').then(mod => mod.Footer4),
  ),
  [footer5Schema.code]: dynamic(() =>
    import('./footer-5').then(mod => mod.Footer5),
  ),
  [footer6Schema.code]: dynamic(() =>
    import('./footer-6').then(mod => mod.Footer6),
  ),
  [footer7Schema.code]: dynamic(() =>
    import('./footer-7').then(mod => mod.Footer7),
  ),
  [footer8Schema.code]: dynamic(() =>
    import('./footer-8').then(mod => mod.Footer8),
  ),
  [footer9Schema.code]: dynamic(() =>
    import('./footer-9').then(mod => mod.Footer9),
  ),
  [footer10Schema.code]: dynamic(() =>
    import('./footer-10').then(mod => mod.Footer10),
  ),
  [footer11Schema.code]: dynamic(() =>
    import('./footer-11').then(mod => mod.Footer11),
  ),
  [footer12Schema.code]: dynamic(() =>
    import('./footer-12').then(mod => mod.Footer12),
  ),
  [footer13Schema.code]: dynamic(() =>
    import('./footer-13').then(mod => mod.Footer13),
  ),
  [footer14Schema.code]: dynamic(() =>
    import('./footer-14').then(mod => mod.Footer14),
  ),
  [footer15Schema.code]: dynamic(() =>
    import('./footer-15').then(mod => mod.Footer15),
  ),
  [wiki1Schema.code]: dynamic(() => import('./wiki-1').then(mod => mod.Wiki1)),
  [sidebarMenu1Schema.code]: dynamic(() =>
    import('./sidebar-menu-1').then(mod => mod.SidebarMenu1),
  ),
};

export const ComponentMap = Object.fromEntries(
  Object.entries(componentMap).map(([key, value]) => [
    formatComponentCode(key),
    value,
  ]),
) as Record<string, ComponentType<TemplateProps>>;
