import type {TemplateSchema, DemoLite} from '../types/templates';

import {about1Demos, about1Schema} from './about-1/meta';
import {about2Demos, about2Schema} from './about-2/meta';
import {about3Demos, about3Schema} from './about-3/meta';
import {about4Demos, about4Schema} from './about-4/meta';
import {about5Demos, about5Schema} from './about-5/meta';
import {about6Demos, about6Schema} from './about-6/meta';
import {about7Demos, about7Schema} from './about-7/meta';
import {about8Demos, about8Schema} from './about-8/meta';
import {about9Demos, about9Schema} from './about-9/meta';
import {about10Demos, about10Schema} from './about-10/meta';
import {about11Demos, about11Schema} from './about-11/meta';
import {about12Demos, about12Schema} from './about-12/meta';
import {about13Demos, about13Schema} from './about-13/meta';
import {about14Demos, about14Schema} from './about-14/meta';
import {about15Demos, about15Schema} from './about-15/meta';
import {about16Demos, about16Schema} from './about-16/meta';
import {about17Demos, about17Schema} from './about-17/meta';
import {about18Demos, about18Schema} from './about-18/meta';
import {about19Demos, about19Schema} from './about-19/meta';
import {about20Demos, about20Schema} from './about-20/meta';
import {about21Demos, about21Schema} from './about-21/meta';
import {about22Demos, about22Schema} from './about-22/meta';
import {about23Demos, about23Schema} from './about-23/meta';
import {about24Demos, about24Schema} from './about-24/meta';
import {about25Demos, about25Schema} from './about-25/meta';
import {blog1Demos, blog1Schema} from './blog-1/meta';
import {blog2Demos, blog2Schema} from './blog-2/meta';
import {blog3Demos, blog3Schema} from './blog-3/meta';
import {blog4Demos, blog4Schema} from './blog-4/meta';
import {blog5Demos, blog5Schema} from './blog-5/meta';
import {banner1Demos, banner1Schema} from './banner-1/meta';
import {banner2Demos, banner2Schema} from './banner-2/meta';
import {banner3Demos, banner3Schema} from './banner-3/meta';
import {banner5Demos, banner5Schema} from './banner-5/meta';
import {banner6Demos, banner6Schema} from './banner-6/meta';
import {clientlist1Demos, clientlist1Schema} from './clientlist-1/meta';
import {clientlist2Demos, clientlist2Schema} from './clientlist-2/meta';
import {clientlist3Demos, clientlist3Schema} from './clientlist-3/meta';
import {clientlist4Demos, clientlist4Schema} from './clientlist-4/meta';
import {clientlist5Demos, clientlist5Schema} from './clientlist-5/meta';
import {contact1Demos, contact1Schema} from './contact-1/meta';
import {contact2Demos, contact2Schema} from './contact-2/meta';
import {contact3Demos, contact3Schema} from './contact-3/meta';
import {contact4Demos, contact4Schema} from './contact-4/meta';
import {contact5Demos, contact5Schema} from './contact-5/meta';
import {contact6Demos, contact6Schema} from './contact-6/meta';
import {contact7Demos, contact7Schema} from './contact-7/meta';
import {contact8Demos, contact8Schema} from './contact-8/meta';
import {contact9Demos, contact9Schema} from './contact-9/meta';
import {contact10Demos, contact10Schema} from './contact-10/meta';
import {contact11Demos, contact11Schema} from './contact-11/meta';
import {contact12Demos, contact12Schema} from './contact-12/meta';
import {cta1Demos, cta1Schema} from './cta-1/meta';
import {cta2Demos, cta2Schema} from './cta-2/meta';
import {cta3Demos, cta3Schema} from './cta-3/meta';
import {cta4Demos, cta4Schema} from './cta-4/meta';
import {cta5Demos, cta5Schema} from './cta-5/meta';
import {cta6Demos, cta6Schema} from './cta-6/meta';
import {cta7Demos, cta7Schema} from './cta-7/meta';
import {cta8Demos, cta8Schema} from './cta-8/meta';
import {cta9Demos, cta9Schema} from './cta-9/meta';
import {facts1Demos, facts1Schema} from './facts-1/meta';
import {facts2Demos, facts2Schema} from './facts-2/meta';
import {facts3Demos, facts3Schema} from './facts-3/meta';
import {facts4Demos, facts4Schema} from './facts-4/meta';
import {facts5Demos, facts5Schema} from './facts-5/meta';
import {facts6Demos, facts6Schema} from './facts-6/meta';
import {facts7Demos, facts7Schema} from './facts-7/meta';
import {facts8Demos, facts8Schema} from './facts-8/meta';
import {facts9Demos, facts9Schema} from './facts-9/meta';
import {facts10Demos, facts10Schema} from './facts-10/meta';
import {facts11Demos, facts11Schema} from './facts-11/meta';
import {facts12Demos, facts12Schema} from './facts-12/meta';
import {facts13Demos, facts13Schema} from './facts-13/meta';
import {facts14Demos, facts14Schema} from './facts-14/meta';
import {facts15Demos, facts15Schema} from './facts-15/meta';
import {facts16Demos, facts16Schema} from './facts-16/meta';
import {facts17Demos, facts17Schema} from './facts-17/meta';
import {faq1Demos, faq1Schema} from './faq-1/meta';
import {faq2Demos, faq2Schema} from './faq-2/meta';
import {faq3Demos, faq3Schema} from './faq-3/meta';
import {faq4Demos, faq4Schema} from './faq-4/meta';
import {faq5Demos, faq5Schema} from './faq-5/meta';
import {faq6Demos, faq6Schema} from './faq-6/meta';
import {footer1Demos, footer1Schema} from './footer-1/meta';
import {footer2Demos, footer2Schema} from './footer-2/meta';
import {footer3Demos, footer3Schema} from './footer-3/meta';
import {footer4Demos, footer4Schema} from './footer-4/meta';
import {footer5Demos, footer5Schema} from './footer-5/meta';
import {footer6Demos, footer6Schema} from './footer-6/meta';
import {footer7Demos, footer7Schema} from './footer-7/meta';
import {footer8Demos, footer8Schema} from './footer-8/meta';
import {footer9Demos, footer9Schema} from './footer-9/meta';
import {footer10Demos, footer10Schema} from './footer-10/meta';
import {footer11Demos, footer11Schema} from './footer-11/meta';
import {footer12Demos, footer12Schema} from './footer-12/meta';
import {footer13Demos, footer13Schema} from './footer-13/meta';
import {footer14Demos, footer14Schema} from './footer-14/meta';
import {footer15Demos, footer15Schema} from './footer-15/meta';
import {hero1Demos, hero1Schema} from './hero-1/meta';
import {hero2Demos, hero2Schema} from './hero-2/meta';
import {hero3Demos, hero3Schema} from './hero-3/meta';
import {hero4Demos, hero4Schema} from './hero-4/meta';
import {hero5Demos, hero5Schema} from './hero-5/meta';
import {hero6Demos, hero6Schema} from './hero-6/meta';
import {hero7Demos, hero7Schema} from './hero-7/meta';
import {hero8Demos, hero8Schema} from './hero-8/meta';
import {hero9Demos, hero9Schema} from './hero-9/meta';
import {hero10Demos, hero10Schema} from './hero-10/meta';
import {hero11Demos, hero11Schema} from './hero-11/meta';
import {hero12Demos, hero12Schema} from './hero-12/meta';
import {hero13Demos, hero13Schema} from './hero-13/meta';
import {hero14Demos, hero14Schema} from './hero-14/meta';
import {hero15Demos, hero15Schema} from './hero-15/meta';
import {hero16Demos, hero16Schema} from './hero-16/meta';
import {hero17Demos, hero17Schema} from './hero-17/meta';
import {hero18Demos, hero18Schema} from './hero-18/meta';
import {hero19Demos, hero19Schema} from './hero-19/meta';
import {hero20Demos, hero20Schema} from './hero-20/meta';
import {hero21Demos, hero21Schema} from './hero-21/meta';
import {hero22Demos, hero22Schema} from './hero-22/meta';
import {hero23Demos, hero23Schema} from './hero-23/meta';
import {hero24Demos, hero24Schema} from './hero-24/meta';
import {hr1Demos, hr1Schema} from './hr-1/meta';
import {navbar1Demos, navbar1Schema} from './navbar-1/meta';
import {pageProgress1Demos, pageProgress1Schema} from './page-progress-1/meta';
import {pricing1Demos, pricing1Schema} from './pricing-1/meta';
import {pricing2Demos, pricing2Schema} from './pricing-2/meta';
import {pricing3Demos, pricing3Schema} from './pricing-3/meta';
import {pricing4Demos, pricing4Schema} from './pricing-4/meta';
import {pricing5Demos, pricing5Schema} from './pricing-5/meta';
import {pricing6Demos, pricing6Schema} from './pricing-6/meta';
import {pricing7Demos, pricing7Schema} from './pricing-7/meta';
import {pricing8Demos, pricing8Schema} from './pricing-8/meta';
import {portfolio1Demos, portfolio1Schema} from './portfolio-1/meta';
import {portfolio2Demos, portfolio2Schema} from './portfolio-2/meta';
import {portfolio3Demos, portfolio3Schema} from './portfolio-3/meta';
import {portfolio4Demos, portfolio4Schema} from './portfolio-4/meta';
import {portfolio5Demos, portfolio5Schema} from './portfolio-5/meta';
import {portfolio6Demos, portfolio6Schema} from './portfolio-6/meta';
import {portfolio7Demos, portfolio7Schema} from './portfolio-7/meta';
import {portfolio8Demos, portfolio8Schema} from './portfolio-8/meta';
import {portfolio9Demos, portfolio9Schema} from './portfolio-9/meta';
import {portfolio10Demos, portfolio10Schema} from './portfolio-10/meta';
import {portfolio11Demos, portfolio11Schema} from './portfolio-11/meta';
import {portfolio12Demos, portfolio12Schema} from './portfolio-12/meta';
import {process1Demos, process1Schema} from './process-1/meta';
import {process2Demos, process2Schema} from './process-2/meta';
import {process3Demos, process3Schema} from './process-3/meta';
import {process4Demos, process4Schema} from './process-4/meta';
import {process5Demos, process5Schema} from './process-5/meta';
import {process6Demos, process6Schema} from './process-6/meta';
import {process7Demos, process7Schema} from './process-7/meta';
import {process9Demos, process9Schema} from './process-9/meta';
import {process10Demos, process10Schema} from './process-10/meta';
import {process11Demos, process11Schema} from './process-11/meta';
import {process12Demos, process12Schema} from './process-12/meta';
import {process13Demos, process13Schema} from './process-13/meta';
import {process14Demos, process14Schema} from './process-14/meta';
import {process15Demos, process15Schema} from './process-15/meta';
import {service1Demos, service1Schema} from './service-1/meta';
import {service2Demos, service2Schema} from './service-2/meta';
import {service3Demos, service3Schema} from './service-3/meta';
import {service4Demos, service4Schema} from './service-4/meta';
import {service5Demos, service5Schema} from './service-5/meta';
import {service6Demos, service6Schema} from './service-6/meta';
import {service7Demos, service7Schema} from './service-7/meta';
import {service8Demos, service8Schema} from './service-8/meta';
import {service9Demos, service9Schema} from './service-9/meta';
import {service10Demos, service10Schema} from './service-10/meta';
import {service11Demos, service11Schema} from './service-11/meta';
import {service12Demos, service12Schema} from './service-12/meta';
import {service13Demos, service13Schema} from './service-13/meta';
import {service14Demos, service14Schema} from './service-14/meta';
import {service15Demos, service15Schema} from './service-15/meta';
import {service16Demos, service16Schema} from './service-16/meta';
import {service17Demos, service17Schema} from './service-17/meta';
import {service18Demos, service18Schema} from './service-18/meta';
import {service19Demos, service19Schema} from './service-19/meta';
import {service20Demos, service20Schema} from './service-20/meta';
import {service21Demos, service21Schema} from './service-21/meta';
import {service22Demos, service22Schema} from './service-22/meta';
import {service23Demos, service23Schema} from './service-23/meta';
import {service24Demos, service24Schema} from './service-24/meta';
import {service25Demos, service25Schema} from './service-25/meta';
import {service26Demos, service26Schema} from './service-26/meta';
import {service27Demos, service27Schema} from './service-27/meta';
import {sidebarMenu1Demos, sidebarMenu1Schema} from './sidebar-menu-1/meta';
import {team1Demos, team1Schema} from './team-1/meta';
import {team2Demos, team2Schema} from './team-2/meta';
import {team3Demos, team3Schema} from './team-3/meta';
import {team4Demos, team4Schema} from './team-4/meta';
import {team5Demos, team5Schema} from './team-5/meta';
import {team6Demos, team6Schema} from './team-6/meta';
import {team7Demos, team7Schema} from './team-7/meta';
import {testimonial1Demos, testimonial1Schema} from './testimonial-1/meta';
import {testimonial2Demos, testimonial2Schema} from './testimonial-2/meta';
import {testimonial3Demos, testimonial3Schema} from './testimonial-3/meta';
import {testimonial4Demos, testimonial4Schema} from './testimonial-4/meta';
import {testimonial5Demos, testimonial5Schema} from './testimonial-5/meta';
import {testimonial6Demos, testimonial6Schema} from './testimonial-6/meta';
import {testimonial7Demos, testimonial7Schema} from './testimonial-7/meta';
import {testimonial8Demos, testimonial8Schema} from './testimonial-8/meta';
import {testimonial9Demos, testimonial9Schema} from './testimonial-9/meta';
import {testimonial10Demos, testimonial10Schema} from './testimonial-10/meta';
import {testimonial11Demos, testimonial11Schema} from './testimonial-11/meta';
import {testimonial12Demos, testimonial12Schema} from './testimonial-12/meta';
import {testimonial13Demos, testimonial13Schema} from './testimonial-13/meta';
import {testimonial14Demos, testimonial14Schema} from './testimonial-14/meta';
import {testimonial15Demos, testimonial15Schema} from './testimonial-15/meta';
import {testimonial16Demos, testimonial16Schema} from './testimonial-16/meta';
import {testimonial17Demos, testimonial17Schema} from './testimonial-17/meta';
import {testimonial18Demos, testimonial18Schema} from './testimonial-18/meta';
import {testimonial19Demos, testimonial19Schema} from './testimonial-19/meta';
import {wiki1Schema} from './wiki-1/meta';
import {wiki1Demos} from './wiki-1/demo';

export const metas: {
  schema: TemplateSchema;
  demos: DemoLite<TemplateSchema>[];
}[] = [
  {schema: about1Schema, demos: about1Demos},
  {schema: about2Schema, demos: about2Demos},
  {schema: about3Schema, demos: about3Demos},
  {schema: about4Schema, demos: about4Demos},
  {schema: about5Schema, demos: about5Demos},
  {schema: about6Schema, demos: about6Demos},
  {schema: about7Schema, demos: about7Demos},
  {schema: about8Schema, demos: about8Demos},
  {schema: about9Schema, demos: about9Demos},
  {schema: about10Schema, demos: about10Demos},
  {schema: about11Schema, demos: about11Demos},
  {schema: about12Schema, demos: about12Demos},
  {schema: about13Schema, demos: about13Demos},
  {schema: about14Schema, demos: about14Demos},
  {schema: about15Schema, demos: about15Demos},
  {schema: about16Schema, demos: about16Demos},
  {schema: about17Schema, demos: about17Demos},
  {schema: about18Schema, demos: about18Demos},
  {schema: about19Schema, demos: about19Demos},
  {schema: about20Schema, demos: about20Demos},
  {schema: about21Schema, demos: about21Demos},
  {schema: about22Schema, demos: about22Demos},
  {schema: about23Schema, demos: about23Demos},
  {schema: about24Schema, demos: about24Demos},
  {schema: about25Schema, demos: about25Demos},
  {schema: blog1Schema, demos: blog1Demos},
  {schema: blog2Schema, demos: blog2Demos},
  {schema: blog3Schema, demos: blog3Demos},
  {schema: blog4Schema, demos: blog4Demos},
  {schema: blog5Schema, demos: blog5Demos},
  {schema: banner1Schema, demos: banner1Demos},
  {schema: banner2Schema, demos: banner2Demos},
  {schema: banner3Schema, demos: banner3Demos},
  {schema: banner5Schema, demos: banner5Demos},
  {schema: banner6Schema, demos: banner6Demos},
  {schema: hero1Schema, demos: hero1Demos},
  {schema: hero2Schema, demos: hero2Demos},
  {schema: hero3Schema, demos: hero3Demos},
  {schema: hero4Schema, demos: hero4Demos},
  {schema: hero5Schema, demos: hero5Demos},
  {schema: hero6Schema, demos: hero6Demos},
  {schema: hero7Schema, demos: hero7Demos},
  {schema: hero8Schema, demos: hero8Demos},
  {schema: hero9Schema, demos: hero9Demos},
  {schema: hero10Schema, demos: hero10Demos},
  {schema: hero11Schema, demos: hero11Demos},
  {schema: hero12Schema, demos: hero12Demos},
  {schema: hero13Schema, demos: hero13Demos},
  {schema: hero14Schema, demos: hero14Demos},
  {schema: hero15Schema, demos: hero15Demos},
  {schema: hero16Schema, demos: hero16Demos},
  {schema: hero17Schema, demos: hero17Demos},
  {schema: hero18Schema, demos: hero18Demos},
  {schema: hero19Schema, demos: hero19Demos},
  {schema: hero20Schema, demos: hero20Demos},
  {schema: hero21Schema, demos: hero21Demos},
  {schema: hero22Schema, demos: hero22Demos},
  {schema: hero23Schema, demos: hero23Demos},
  {schema: hero24Schema, demos: hero24Demos},
  {schema: hr1Schema, demos: hr1Demos},
  {schema: cta1Schema, demos: cta1Demos},
  {schema: cta2Schema, demos: cta2Demos},
  {schema: cta3Schema, demos: cta3Demos},
  {schema: cta4Schema, demos: cta4Demos},
  {schema: cta5Schema, demos: cta5Demos},
  {schema: cta6Schema, demos: cta6Demos},
  {schema: cta7Schema, demos: cta7Demos},
  {schema: cta8Schema, demos: cta8Demos},
  {schema: cta9Schema, demos: cta9Demos},
  {schema: facts1Schema, demos: facts1Demos},
  {schema: facts2Schema, demos: facts2Demos},
  {schema: facts3Schema, demos: facts3Demos},
  {schema: facts4Schema, demos: facts4Demos},
  {schema: facts5Schema, demos: facts5Demos},
  {schema: facts6Schema, demos: facts6Demos},
  {schema: facts7Schema, demos: facts7Demos},
  {schema: facts8Schema, demos: facts8Demos},
  {schema: facts9Schema, demos: facts9Demos},
  {schema: facts10Schema, demos: facts10Demos},
  {schema: facts11Schema, demos: facts11Demos},
  {schema: facts12Schema, demos: facts12Demos},
  {schema: facts13Schema, demos: facts13Demos},
  {schema: facts14Schema, demos: facts14Demos},
  {schema: facts15Schema, demos: facts15Demos},
  {schema: facts16Schema, demos: facts16Demos},
  {schema: facts17Schema, demos: facts17Demos},
  {schema: faq1Schema, demos: faq1Demos},
  {schema: faq2Schema, demos: faq2Demos},
  {schema: faq3Schema, demos: faq3Demos},
  {schema: faq4Schema, demos: faq4Demos},
  {schema: faq5Schema, demos: faq5Demos},
  {schema: faq6Schema, demos: faq6Demos},
  {schema: process1Schema, demos: process1Demos},
  {schema: process2Schema, demos: process2Demos},
  {schema: process3Schema, demos: process3Demos},
  {schema: process4Schema, demos: process4Demos},
  {schema: process5Schema, demos: process5Demos},
  {schema: process6Schema, demos: process6Demos},
  {schema: process7Schema, demos: process7Demos},
  {schema: process9Schema, demos: process9Demos},
  {schema: process10Schema, demos: process10Demos},
  {schema: process11Schema, demos: process11Demos},
  {schema: process12Schema, demos: process12Demos},
  {schema: process13Schema, demos: process13Demos},
  {schema: process14Schema, demos: process14Demos},
  {schema: process15Schema, demos: process15Demos},
  {schema: service1Schema, demos: service1Demos},
  {schema: service2Schema, demos: service2Demos},
  {schema: service3Schema, demos: service3Demos},
  {schema: service4Schema, demos: service4Demos},
  {schema: service5Schema, demos: service5Demos},
  {schema: service6Schema, demos: service6Demos},
  {schema: service7Schema, demos: service7Demos},
  {schema: service8Schema, demos: service8Demos},
  {schema: service9Schema, demos: service9Demos},
  {schema: service10Schema, demos: service10Demos},
  {schema: service11Schema, demos: service11Demos},
  {schema: service12Schema, demos: service12Demos},
  {schema: service13Schema, demos: service13Demos},
  {schema: service14Schema, demos: service14Demos},
  {schema: service15Schema, demos: service15Demos},
  {schema: service16Schema, demos: service16Demos},
  {schema: service17Schema, demos: service17Demos},
  {schema: service18Schema, demos: service18Demos},
  {schema: service19Schema, demos: service19Demos},
  {schema: service20Schema, demos: service20Demos},
  {schema: service21Schema, demos: service21Demos},
  {schema: service22Schema, demos: service22Demos},
  {schema: service23Schema, demos: service23Demos},
  {schema: service24Schema, demos: service24Demos},
  {schema: service25Schema, demos: service25Demos},
  {schema: service26Schema, demos: service26Demos},
  {schema: service27Schema, demos: service27Demos},
  {schema: team1Schema, demos: team1Demos},
  {schema: team2Schema, demos: team2Demos},
  {schema: team3Schema, demos: team3Demos},
  {schema: team4Schema, demos: team4Demos},
  {schema: team5Schema, demos: team5Demos},
  {schema: team6Schema, demos: team6Demos},
  {schema: team7Schema, demos: team7Demos},
  {schema: testimonial1Schema, demos: testimonial1Demos},
  {schema: testimonial2Schema, demos: testimonial2Demos},
  {schema: testimonial3Schema, demos: testimonial3Demos},
  {schema: testimonial4Schema, demos: testimonial4Demos},
  {schema: testimonial5Schema, demos: testimonial5Demos},
  {schema: testimonial6Schema, demos: testimonial6Demos},
  {schema: testimonial7Schema, demos: testimonial7Demos},
  {schema: testimonial8Schema, demos: testimonial8Demos},
  {schema: testimonial9Schema, demos: testimonial9Demos},
  {schema: testimonial10Schema, demos: testimonial10Demos},
  {schema: testimonial11Schema, demos: testimonial11Demos},
  {schema: testimonial12Schema, demos: testimonial12Demos},
  {schema: testimonial13Schema, demos: testimonial13Demos},
  {schema: testimonial14Schema, demos: testimonial14Demos},
  {schema: testimonial15Schema, demos: testimonial15Demos},
  {schema: testimonial16Schema, demos: testimonial16Demos},
  {schema: testimonial17Schema, demos: testimonial17Demos},
  {schema: testimonial18Schema, demos: testimonial18Demos},
  {schema: testimonial19Schema, demos: testimonial19Demos},
  {schema: pricing1Schema, demos: pricing1Demos},
  {schema: pricing2Schema, demos: pricing2Demos},
  {schema: pricing3Schema, demos: pricing3Demos},
  {schema: pricing4Schema, demos: pricing4Demos},
  {schema: pricing5Schema, demos: pricing5Demos},
  {schema: pricing6Schema, demos: pricing6Demos},
  {schema: pricing7Schema, demos: pricing7Demos},
  {schema: pricing8Schema, demos: pricing8Demos},
  {schema: portfolio1Schema, demos: portfolio1Demos},
  {schema: portfolio2Schema, demos: portfolio2Demos},
  {schema: portfolio3Schema, demos: portfolio3Demos},
  {schema: portfolio4Schema, demos: portfolio4Demos},
  {schema: portfolio5Schema, demos: portfolio5Demos},
  {schema: portfolio6Schema, demos: portfolio6Demos},
  {schema: portfolio7Schema, demos: portfolio7Demos},
  {schema: portfolio8Schema, demos: portfolio8Demos},
  {schema: portfolio9Schema, demos: portfolio9Demos},
  {schema: portfolio10Schema, demos: portfolio10Demos},
  {schema: portfolio11Schema, demos: portfolio11Demos},
  {schema: portfolio12Schema, demos: portfolio12Demos},
  {schema: contact1Schema, demos: contact1Demos},
  {schema: contact2Schema, demos: contact2Demos},
  {schema: contact3Schema, demos: contact3Demos},
  {schema: contact4Schema, demos: contact4Demos},
  {schema: contact5Schema, demos: contact5Demos},
  {schema: contact6Schema, demos: contact6Demos},
  {schema: contact7Schema, demos: contact7Demos},
  {schema: contact8Schema, demos: contact8Demos},
  {schema: contact9Schema, demos: contact9Demos},
  {schema: contact10Schema, demos: contact10Demos},
  {schema: contact11Schema, demos: contact11Demos},
  {schema: contact12Schema, demos: contact12Demos},
  {schema: clientlist1Schema, demos: clientlist1Demos},
  {schema: clientlist2Schema, demos: clientlist2Demos},
  {schema: clientlist3Schema, demos: clientlist3Demos},
  {schema: clientlist4Schema, demos: clientlist4Demos},
  {schema: clientlist5Schema, demos: clientlist5Demos},
  {schema: pageProgress1Schema, demos: pageProgress1Demos},
  {schema: footer1Schema, demos: footer1Demos},
  {schema: footer2Schema, demos: footer2Demos},
  {schema: footer3Schema, demos: footer3Demos},
  {schema: footer4Schema, demos: footer4Demos},
  {schema: footer5Schema, demos: footer5Demos},
  {schema: footer6Schema, demos: footer6Demos},
  {schema: footer7Schema, demos: footer7Demos},
  {schema: footer8Schema, demos: footer8Demos},
  {schema: footer9Schema, demos: footer9Demos},
  {schema: footer10Schema, demos: footer10Demos},
  {schema: footer11Schema, demos: footer11Demos},
  {schema: footer12Schema, demos: footer12Demos},
  {schema: footer13Schema, demos: footer13Demos},
  {schema: footer14Schema, demos: footer14Demos},
  {schema: footer15Schema, demos: footer15Demos},
  {schema: sidebarMenu1Schema, demos: sidebarMenu1Demos},
  {schema: navbar1Schema, demos: navbar1Demos},
  {schema: wiki1Schema, demos: wiki1Demos},
];
