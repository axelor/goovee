import {
  Data,
  Demo,
  Template,
  TemplateSchema,
} from '@/subapps/website/common/types/templates';
import {metaFileModel} from '../meta-models';

export const cta1Schema = {
  title: 'CTA 1',
  code: 'cta1',
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
      name: 'image',
      title: 'Image',
      type: 'many-to-one',
      target: 'com.axelor.meta.db.MetaFile',
      widget: 'Image',
    },
    {
      name: 'wrapperClassName',
      title: 'Wrapper Class Name',
      type: 'string',
    },
    {
      name: 'containerClassName',
      title: 'Container Class Name',
      type: 'string',
    },
  ],
  metaModels: [metaFileModel],
} as const satisfies TemplateSchema;

export type Cta1Data = Data<typeof cta1Schema>;

export const cta1Demos: Demo<typeof cta1Schema>[] = [
  {
    language: 'en_US',
    data: {
      cta1Image: {
        id: '1',
        version: 1,
        fileName: 'i3.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i3.png',
      },
      cta1Title: 'Analyze Now',
      cta1Caption:
        'Improve your website. Check SEO score for faster speed, higher rankings, & more traffic.',
      cta1Description:
        'Digital marketing encompasses a wide range of activities, including search engine optimization, social media marketing, email marketing, and content marketing. By leveraging businesses can increase their visibility online.',
    },
  },
  {
    language: 'fr_FR',
    data: {
      cta1Image: {
        id: '1',
        version: 1,
        fileName: 'i3.png',
        fileType: 'image/png',
        filePath: '/img/illustrations/i3.png',
      },
      cta1Title: 'Analyser maintenant',
      cta1Caption:
        'Améliorez votre site web. Vérifiez le score SEO pour une vitesse plus rapide, un meilleur classement et plus de trafic.',
      cta1Description:
        "Le marketing numérique englobe un large éventail d'activités, notamment l'optimisation des moteurs de recherche, le marketing des médias sociaux, le marketing par e-mail et le marketing de contenu. En tirant parti, les entreprises peuvent accroître leur visibilité en ligne.",
    },
  },
];
