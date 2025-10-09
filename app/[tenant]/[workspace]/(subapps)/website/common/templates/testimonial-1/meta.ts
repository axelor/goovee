import {
  Template,
  Data,
  Demo,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';

export const testimonial1Schema = {
  title: 'Testimonial 1',
  code: 'testimonial1',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'linkText',
      title: 'Link Text',
      type: 'string',
    },
    {
      name: 'link',
      title: 'Link',
      type: 'string',
    },
    {
      name: 'testimonialList',
      title: 'Testimonial List',
      type: 'json-one-to-many',
      target: 'Testimonial1TestimonialList',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
      defaultValue: 'wrapper bg-gradient-reverse-primary',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
      defaultValue: 'container py-14 py-md-18',
    },
  ],
  models: [
    {
      name: 'Testimonial1TestimonialList',
      title: 'Testimonial 1 Testimonial List',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          nameField: true,
          visibleInGrid: true,
        },
        {
          name: 'designation',
          title: 'Designation',
          type: 'string',
          visibleInGrid: true,
        },
        {
          name: 'review',
          title: 'Review',
          type: 'string',
        },
        {
          name: 'columnClasses',
          title: 'Column Classes',
          type: 'string',
        },
      ],
    },
  ],
} as const satisfies TemplateSchema;

export type Testimonial1Data = Data<typeof testimonial1Schema>;

export const testimonial1Demos: Demo<typeof testimonial1Schema>[] = [
  {
    language: 'en_US',
    page: 'demo-1',
    sequence: 8,
    data: {
      testimonial1Link: '#',
      testimonial1Title: 'Our Community',
      testimonial1Caption:
        "Don't believe anything we say. Check out what our clients are saying about us.",
      testimonial1LinkText: 'All Testimonials',
      testimonial1Description:
        'They provided excellent communication and kept me informed every step of the way. The end product exceeded my expectations and has already made a significant impact on my business. I would highly recommend Lighthouse.',
      testimonial1TestimonialList: [
        {
          id: '24',
          version: 1,
          attrs: {
            name: 'Tom Onix',
            review: 'Their team  knowledge, professional, & easy to work',
            designation: 'Financial Analyst',
            columnClasses: 'col-xl-5 align-self-end',
          },
        },
        {
          id: '25',
          version: 1,
          attrs: {
            name: 'Lessar Carey',
            review:
              'I would highly recommend [Company Name] to anyone looking for top-notch services. Impact on my business',
            designation: 'Marketing Specialist',
            columnClasses: 'align-self-end',
          },
        },
        {
          id: '26',
          version: 1,
          attrs: {
            name: 'Ocsiloco Termend',
            review:
              'They provided excellent communication and kept me informed every step of the way.',
            designation: 'Sales Specialist',
            columnClasses: 'col-xl-5 offset-xl-1',
          },
        },
        {
          id: '27',
          version: 1,
          attrs: {
            name: 'Aliko Andree',
            review:
              'The end product exceeded my expectations and has already made a impact on my business.',
            designation: 'Investment Planner',
            columnClasses: 'align-self-start',
          },
        },
      ],
    },
  },
  {
    language: 'fr_FR',
    page: 'demo-1',
    sequence: 8,
    data: {
      testimonial1Link: '#',
      testimonial1Title: 'Notre communauté',
      testimonial1Caption:
        'Ne croyez rien de ce que nous disons. Découvrez ce que nos clients disent de nous.',
      testimonial1LinkText: 'Tous les témoignages',
      testimonial1Description:
        "Ils ont fourni une excellente communication et m'ont tenu informé à chaque étape. Le produit final a dépassé mes attentes et a déjà eu un impact significatif sur mon entreprise. Je recommanderais vivement Lighthouse.",
      testimonial1TestimonialList: [
        {
          id: '24',
          version: 1,
          attrs: {
            name: 'Tom Onix',
            review:
              "Leurs connaissances de l'équipe, leur professionnalisme et leur facilité à travailler",
            designation: 'Analyste financier',
            columnClasses: 'col-xl-5 align-self-end',
          },
        },
        {
          id: '25',
          version: 1,
          attrs: {
            name: 'Lessar Carey',
            review:
              "Je recommande vivement [Nom de l'entreprise] à quiconque recherche des services de premier ordre. Impact sur mon entreprise",
            designation: 'Spécialiste en marketing',
            columnClasses: 'align-self-end',
          },
        },
        {
          id: '26',
          version: 1,
          attrs: {
            name: 'Ocsiloco Termend',
            review:
              "Ils ont fourni une excellente communication et m'ont tenu informé à chaque étape.",
            designation: 'Spécialiste des ventes',
            columnClasses: 'col-xl-5 offset-xl-1',
          },
        },
        {
          id: '27',
          version: 1,
          attrs: {
            name: 'Aliko Andree',
            review:
              'Le produit final a dépassé mes attentes et a déjà eu un impact sur mon entreprise.',
            designation: "Planificateur d'investissement",
            columnClasses: 'align-self-start',
          },
        },
      ],
    },
  },
];
