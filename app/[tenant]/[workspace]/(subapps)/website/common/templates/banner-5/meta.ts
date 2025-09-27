import {
  Template,
  type Data,
  type Demo,
  type TemplateSchema,
} from '../../types/templates';

export const banner5Schema = {
  title: 'Banner 5',
  code: 'banner5',
  type: Template.block,
  fields: [
    {
      name: 'heading',
      title: 'Heading',
      type: 'string',
    },
    {
      name: 'video',
      title: 'Video',
      type: 'string',
    },
  ],
  models: [],
} as const satisfies TemplateSchema;

export type Banner5Data = Data<typeof banner5Schema>;

export const banner5Demos: Demo<typeof banner5Schema>[] = [
  {
    language: 'en_US',
    data: {
      banner5Heading:
        "I'd like to provide you with a one-of-a-kind video and photo package customized to your specific needs.",
      banner5Video: '409924928',
    },
  },
  {
    language: 'fr_FR',
    data: {
      banner5Heading:
        'Je souhaite vous proposer un forfait vidéo et photo unique en son genre, adapté à vos besoins spécifiques.',
      banner5Video: '409924928',
    },
  },
];
