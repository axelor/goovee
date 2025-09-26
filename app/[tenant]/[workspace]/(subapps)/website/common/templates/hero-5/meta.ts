
import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const hero5Schema = {
  title: 'Hero 5',
  code: 'hero5',
  type: Template.block,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'string',
    },
    {
      name: 'buttonLabel1',
      title: 'Button Label 1',
      type: 'string',
    },
    {
      name: 'buttonLabel2',
      title: 'Button Label 2',
      type: 'string',
    },
    {
      name: 'buttonLink1',
      title: 'Button Link 1',
      type: 'string',
    },
    {
      name: 'buttonLink2',
      title: 'Button Link 2',
      type: 'string',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Hero5Data = Data<typeof hero5Schema>;

export const hero5Demos: Demo<typeof hero5Schema>[] = [
  {
    language: 'en_US',
    data: {
      hero5Title: 'Keeping track of your expenses is now even simpler.',
      hero5Description:
        "You'll have no issue achieving your financial targets. Keep care of all of your recurring and one-time spending and earnings in one location.",
      hero5ButtonLabel1: 'Get Started',
      hero5ButtonLabel2: 'Free Trial',
      hero5ButtonLink1: '#',
      hero5ButtonLink2: '#',
    },
  },
  {
    language: 'fr_FR',
    data: {
      hero5Title: 'Le suivi de vos dépenses est désormais encore plus simple.',
      hero5Description:
        'Vous n’aurez aucun mal à atteindre vos objectifs financiers. Conservez toutes vos dépenses et revenus récurrents et ponctuels en un seul endroit.',
      hero5ButtonLabel1: 'Commencer',
      hero5ButtonLabel2: 'Essai gratuit',
      hero5ButtonLink1: '#',
      hero5ButtonLink2: '#',
    },
  },
];
